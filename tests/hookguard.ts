import * as anchor from "@anchor-lang/core";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

import type { Jetty } from "../target/types/jetty";
import {
  EXTRA_ACCOUNT_META_LIST_SIZE,
  createFundedUser,
  createHookFixture,
  createTransferHookMint,
  deriveAllowlistEntryPda,
  deriveExtraAccountMetaListPda,
  deriveHookConfigPda,
  extractErrorCode,
  getPayer,
  getTokenAmount,
  transferWithHook,
} from "./utils/helpers";

const JETTY_ERROR = {
  TransferPaused: 6000,
  ExceedsVolumeLimit: 6001,
  SourceNotAllowlisted: 6002,
  DestinationNotAllowlisted: 6003,
  Unauthorized: 6004,
  NotTransferring: 6005,
} as const;

async function expectJettyError(promise: Promise<unknown>, code: number): Promise<void> {
  try {
    await promise;
    expect.fail(`Expected Jetty error ${code} but instruction succeeded`);
  } catch (error) {
    const actual = extractErrorCode(error);
    expect(actual, `Expected error ${code}, got ${actual}\n${String(error)}`).to.equal(code);
  }
}

describe("hookguard", function () {
  this.timeout(200_000);

    const provider = new anchor.AnchorProvider(
  anchor.AnchorProvider.env().connection,
  anchor.AnchorProvider.env().wallet,
  { commitment: "confirmed", preflightCommitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Jetty as anchor.Program<Jetty>;

  // authority === provider.wallet.publicKey — the key Anchor signs every
  // .rpc() call with. Using this consistently ensures on-chain stored keys
  // always match the signer Anchor presents.
  const authority = getPayer(provider);

  // ─── initialize_hook_config ───────────────────────────────────────────────

  describe("initialize_hook_config", () => {
    it("should initialize HookConfig with correct defaults", async () => {
      const mint = await createTransferHookMint(provider, program.programId);
      const [hookConfigPda, hookConfigBump] = deriveHookConfigPda(mint.publicKey, program.programId);

      await program.methods
        .initializeHookConfig()
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: mint.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      const hookConfig = await program.account.hookConfig.fetch(hookConfigPda, "confirmed");
      expect(hookConfig.mint.equals(mint.publicKey)).to.equal(true);
      expect(hookConfig.policyAuthority.equals(authority)).to.equal(true);
      expect(hookConfig.bump).to.equal(hookConfigBump);
      expect(hookConfig.paused).to.equal(false);
      expect(hookConfig.allowlistEnabled).to.equal(false);
      expect(hookConfig.maxTransferAmount.toString()).to.equal("0");
    });

    it("should fail if called twice for the same mint", async () => {
      const mint = await createTransferHookMint(provider, program.programId);

      await program.methods
        .initializeHookConfig()
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: mint.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      try {
        await program.methods
          .initializeHookConfig()
          .accounts({
            payer: authority,
            policyAuthority: authority,
            mint: mint.publicKey,
          })
          .rpc({ commitment: "confirmed" });
        expect.fail("Second initialize_hook_config should have failed");
      } catch (error) {
        expect(String(error)).to.match(/already in use/i);
      }
    });
  });

  // ─── init_extra_account_meta_list ─────────────────────────────────────────

  describe("init_extra_account_meta_list", () => {
    it("should create ExtraAccountMetaList with correct size and owner", async () => {
      const mint = await createTransferHookMint(provider, program.programId);
      const [extraAccountMetaListPda] = deriveExtraAccountMetaListPda(mint.publicKey, program.programId);

      await program.methods
        .initializeHookConfig()
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: mint.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      await program.methods
        .initExtraAccountMetaList()
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: mint.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });

      const accountInfo = await provider.connection.getAccountInfo(
        extraAccountMetaListPda,
        "confirmed"
      );
      expect(accountInfo, "ExtraAccountMetaList account must exist").to.not.equal(null);
      expect(accountInfo!.owner.equals(program.programId)).to.equal(true);
      expect(accountInfo!.data.length).to.equal(EXTRA_ACCOUNT_META_LIST_SIZE);
    });

    it("should fail with Unauthorized when wrong signer initializes list", async () => {
      const mint = await createTransferHookMint(provider, program.programId);
      const wrongAuthority = await createFundedUser(provider);

      await program.methods
        .initializeHookConfig()
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: mint.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      await expectJettyError(
        program.methods
          .initExtraAccountMetaList()
          .accounts({
            payer: authority,
            policyAuthority: wrongAuthority.publicKey,
            mint: mint.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([wrongAuthority])
          .rpc({ commitment: "confirmed" }),
        JETTY_ERROR.Unauthorized
      );
    });
  });

  // ─── update_policy ────────────────────────────────────────────────────────

  describe("update_policy", () => {
    it("should update only the requested policy fields", async () => {
      const fixture = await createHookFixture(program);

      await program.methods
        .updatePolicy({
          paused: true,
          allowlistEnabled: true,
          maxTransferAmount: new anchor.BN(25),
        })
        .accounts({
          policyAuthority: authority,
          mint: fixture.mint.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      const hookConfig = await program.account.hookConfig.fetch(fixture.hookConfigPda, "confirmed");
      expect(hookConfig.paused).to.equal(true);
      expect(hookConfig.allowlistEnabled).to.equal(true);
      expect(hookConfig.maxTransferAmount.toString()).to.equal("25");
    });

    it("should fail with Unauthorized when wrong signer calls update_policy", async () => {
      const fixture = await createHookFixture(program);
      const wrongAuthority = await createFundedUser(provider);

      await expectJettyError(
        program.methods
          .updatePolicy({
            paused: true,
            allowlistEnabled: null,
            maxTransferAmount: null,
          })
          .accounts({
            policyAuthority: wrongAuthority.publicKey,
            mint: fixture.mint.publicKey,
          })
          .signers([wrongAuthority])
          .rpc({ commitment: "confirmed" }),
        JETTY_ERROR.Unauthorized
      );
    });
  });

  // ─── update_allowlist ─────────────────────────────────────────────────────

  describe("update_allowlist", () => {
    it("should create and update an allowlist entry", async () => {
      const fixture = await createHookFixture(program);
      const [allowlistEntryPda, allowlistBump] = deriveAllowlistEntryPda(
        fixture.mint.publicKey,
        fixture.destinationOwner.publicKey,
        program.programId
      );

      await program.methods
        .updateAllowlist(true)
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: fixture.mint.publicKey,
          wallet: fixture.destinationOwner.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      const entry = await program.account.allowlistEntry.fetch(allowlistEntryPda, "confirmed");
      expect(entry.mint.equals(fixture.mint.publicKey)).to.equal(true);
      expect(entry.wallet.equals(fixture.destinationOwner.publicKey)).to.equal(true);
      expect(entry.active).to.equal(true);
      expect(entry.bump).to.equal(allowlistBump);
    });

    it("should fail with Unauthorized when wrong signer calls update_allowlist", async () => {
      const fixture = await createHookFixture(program);
      const wrongAuthority = await createFundedUser(provider);

      await expectJettyError(
        program.methods
          .updateAllowlist(true)
          .accounts({
            payer: authority,
            policyAuthority: wrongAuthority.publicKey,
            mint: fixture.mint.publicKey,
            wallet: fixture.destinationOwner.publicKey,
          })
          .signers([wrongAuthority])
          .rpc({ commitment: "confirmed" }),
        JETTY_ERROR.Unauthorized
      );
    });
  });

  // ─── execute ──────────────────────────────────────────────────────────────

  describe("execute", () => {
    it("should fail with NotTransferring on direct invocation", async () => {
      const fixture = await createHookFixture(program);

      await expectJettyError(
        program.methods
          .execute(new anchor.BN(1))
          .accounts({
            sourceTokenAccount: fixture.sourceTokenAccount,
            mint: fixture.mint.publicKey,
            destinationTokenAccount: fixture.destinationTokenAccount,
            authority: authority,
          })
          .rpc({ commitment: "confirmed" }),
        JETTY_ERROR.NotTransferring
      );
    });

    it("should reject transfer when paused", async () => {
      const fixture = await createHookFixture(program);

      await program.methods
        .updatePolicy({ paused: true, allowlistEnabled: null, maxTransferAmount: null })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: authority,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        JETTY_ERROR.TransferPaused
      );
    });

    it("should reject transfer above max volume limit", async () => {
      const fixture = await createHookFixture(program);

      await program.methods
        .updatePolicy({ paused: null, allowlistEnabled: null, maxTransferAmount: new anchor.BN(5) })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: authority,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        JETTY_ERROR.ExceedsVolumeLimit
      );
    });

    it("should reject transfer when sender not allowlisted", async () => {
      const fixture = await createHookFixture(program);

      // Only allowlist the receiver — sender must be rejected
      await program.methods
        .updateAllowlist(true)
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: fixture.mint.publicKey,
          wallet: fixture.destinationOwner.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      await program.methods
        .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: authority,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        JETTY_ERROR.SourceNotAllowlisted
      );
    });

    it("should reject transfer when receiver not allowlisted", async () => {
      const fixture = await createHookFixture(program);

      // Only allowlist the sender — receiver must be rejected
      await program.methods
        .updateAllowlist(true)
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: fixture.mint.publicKey,
          wallet: fixture.sourceOwner,
        })
        .rpc({ commitment: "confirmed" });

      await program.methods
        .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" });

      await expectJettyError(
        transferWithHook(provider, {
          source: fixture.sourceTokenAccount,
          mint: fixture.mint.publicKey,
          destination: fixture.destinationTokenAccount,
          owner: authority,
          amount: 10n,
          decimals: fixture.decimals,
        }),
        JETTY_ERROR.DestinationNotAllowlisted
      );
    });

    it("should allow transfer when both sender and receiver are allowlisted", async () => {
      const fixture = await createHookFixture(program);

      await program.methods
        .updateAllowlist(true)
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: fixture.mint.publicKey,
          wallet: fixture.sourceOwner,
        })
        .rpc({ commitment: "confirmed" });

      await program.methods
        .updateAllowlist(true)
        .accounts({
          payer: authority,
          policyAuthority: authority,
          mint: fixture.mint.publicKey,
          wallet: fixture.destinationOwner.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      await program.methods
        .updatePolicy({ paused: null, allowlistEnabled: true, maxTransferAmount: null })
        .accounts({ policyAuthority: authority, mint: fixture.mint.publicKey })
        .rpc({ commitment: "confirmed" });

      await transferWithHook(provider, {
        source: fixture.sourceTokenAccount,
        mint: fixture.mint.publicKey,
        destination: fixture.destinationTokenAccount,
        owner: authority,
        amount: 10n,
        decimals: fixture.decimals,
      });

      expect(await getTokenAmount(provider, fixture.sourceTokenAccount)).to.equal(990n);
      expect(await getTokenAmount(provider, fixture.destinationTokenAccount)).to.equal(10n);
    });
  });
});