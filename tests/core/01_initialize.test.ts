/**
 * tests/core/01_initialize.test.ts
 *
 * HookConfig + ExtraAccountMetaList initialization.
 * Covers: happy path, auth rejection, re-init safety, front-run resistance.
 * Error codes exercised: Unauthorized (6004)
 */

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import {
  createTransferHookMint,
  deriveExtraAccountMetaListPda,
  deriveHookConfigPda,
  createFundedUser,
  getPayer,
  EXTRA_ACCOUNT_META_LIST_SIZE,
} from "../utils/helpers";
import { makeProvider, makeProgram, E, expectJettyError } from "../utils/setup";

describe("core/initialize", function () {
  this.timeout(180_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  // ── initialize_hook_config ─────────────────────────────────────────────────

  it("initializes HookConfig with correct defaults", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const [hookConfigPda, hookConfigBump] = deriveHookConfigPda(mint.publicKey, program.programId);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
      .rpc({ commitment: "confirmed" });

    const cfg = await program.account.hookConfig.fetch(hookConfigPda, "confirmed");
    expect(cfg.mint.equals(mint.publicKey)).to.equal(true);
    expect(cfg.policyAuthority.equals(authority)).to.equal(true);
    expect(cfg.bump).to.equal(hookConfigBump);
    expect(cfg.paused).to.equal(false);
    expect(cfg.allowlistEnabled).to.equal(false);
    expect(cfg.vestingEnabled).to.equal(false);
    expect(cfg.denylistEnabled).to.equal(false);
    expect(cfg.maxTransferAmount.toString()).to.equal("0");
    expect(cfg.minTransferAmount.toString()).to.equal("0");
    expect(cfg.maxHolderBps).to.equal(0);
    expect(cfg.cooldownSeconds).to.equal(0);
  });

  it("rejects initialize_hook_config when caller is not the TransferHook extension authority", async () => {
    const wrongAuthority = await createFundedUser(provider);
    // Mint uses payer as TransferHook authority; wrongAuthority is not the hook auth.
    const mint = await createTransferHookMint(provider, program.programId, 2, wrongAuthority.publicKey);

    await expectJettyError(
      program.methods
        .initializeHookConfig()
        .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
        .rpc({ commitment: "confirmed" }),
      E.Unauthorized,
      "non-hook-authority caller"
    );
  });

  it("rejects re-initialization to prevent clobbering stored config on mint recreation", async () => {
    const mint = await createTransferHookMint(provider, program.programId);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Second call should fail because we use `init` instead of `init_if_needed`
    try {
      await program.methods
        .initializeHookConfig()
        .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
        .rpc({ commitment: "confirmed" });
      expect.fail("Expected re-initialization to fail");
    } catch (e: any) {
      expect(e.message).to.include("already in use");
    }
  });

  // ── init_extra_account_meta_list ───────────────────────────────────────────

  it("creates ExtraAccountMetaList with correct size and program ownership", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const [extraMetaPda] = deriveExtraAccountMetaListPda(mint.publicKey, program.programId);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
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

    const info = await provider.connection.getAccountInfo(extraMetaPda, "confirmed");
    expect(info, "ExtraAccountMetaList must exist").to.not.equal(null);
    expect(info!.owner.equals(program.programId)).to.equal(true);
    expect(info!.data.length).to.equal(EXTRA_ACCOUNT_META_LIST_SIZE);
  });

  it("resists PDA front-run: succeeds when ExtraAccountMeta PDA is pre-funded", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const [extraMetaPda] = deriveExtraAccountMetaListPda(mint.publicKey, program.programId);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
      .rpc({ commitment: "confirmed" });

    // Front-run: pre-fund the PDA address
    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: authority,
          toPubkey: extraMetaPda,
          lamports: 1,
        })
      )
    );

    // Should still succeed
    await program.methods
      .initExtraAccountMetaList()
      .accounts({
        payer: authority,
        policyAuthority: authority,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const info = await provider.connection.getAccountInfo(extraMetaPda, "confirmed");
    expect(info!.owner.equals(program.programId)).to.equal(true);
  });

  it("rejects init_extra_account_meta_list from wrong policy authority", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const wrongAuthority = await createFundedUser(provider);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
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
      E.Unauthorized,
      "wrong policy_authority for init_extra_account_meta_list"
    );
  });
});
