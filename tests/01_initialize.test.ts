import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  createTransferHookMint,
  deriveExtraAccountMetaListPda,
  deriveHookConfigPda,
  createFundedUser,
  getPayer,
  EXTRA_ACCOUNT_META_LIST_SIZE,
} from "./utils/helpers";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { makeProvider, makeProgram, JETTY_ERROR, expectJettyError } from "./utils/setup";

describe("initialize_hook_config", function () {
  this.timeout(120_000);

  const provider = makeProvider();
  const program = makeProgram(provider);
  const authority = getPayer(provider);

  it("initialises HookConfig with correct defaults", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const [hookConfigPda, hookConfigBump] = deriveHookConfigPda(mint.publicKey, program.programId);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
      .rpc({ commitment: "confirmed" });

    const hookConfig = await program.account.hookConfig.fetch(hookConfigPda, "confirmed");
    expect(hookConfig.mint.equals(mint.publicKey)).to.equal(true);
    expect(hookConfig.policyAuthority.equals(authority)).to.equal(true);
    expect(hookConfig.bump).to.equal(hookConfigBump);
    expect(hookConfig.paused).to.equal(false);
    expect(hookConfig.allowlistEnabled).to.equal(false);
    expect(hookConfig.maxTransferAmount.toString()).to.equal("0");
  });

  it("rejects a second initialisation for the same mint", async () => {
    const mint = await createTransferHookMint(provider, program.programId);

    await program.methods
      .initializeHookConfig()
      .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
      .rpc({ commitment: "confirmed" });

    try {
      await program.methods
        .initializeHookConfig()
        .accounts({ payer: authority, policyAuthority: authority, mint: mint.publicKey })
        .rpc({ commitment: "confirmed" });
      expect.fail("Second initialize_hook_config should have failed");
    } catch (error) {
      expect(String(error)).to.match(/already in use/i);
    }
  });

  it("rejects initialize_hook_config if caller is not the mint authority", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const wrongAuthority = await createFundedUser(provider);

    await expectJettyError(
      program.methods
        .initializeHookConfig()
        .accounts({ payer: wrongAuthority.publicKey, policyAuthority: wrongAuthority.publicKey, mint: mint.publicKey })
        .signers([wrongAuthority])
        .rpc({ commitment: "confirmed" }),
      JETTY_ERROR.Unauthorized
    );
  });

  // ── init_extra_account_meta_list ───────────────────────────────────────────

  it("creates ExtraAccountMetaList with correct size and owner", async () => {
    const mint = await createTransferHookMint(provider, program.programId);
    const [extraAccountMetaListPda] = deriveExtraAccountMetaListPda(mint.publicKey, program.programId);

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

    const info = await provider.connection.getAccountInfo(extraAccountMetaListPda, "confirmed");
    expect(info, "ExtraAccountMetaList must exist").to.not.equal(null);
    expect(info!.owner.equals(program.programId)).to.equal(true);
    expect(info!.data.length).to.equal(EXTRA_ACCOUNT_META_LIST_SIZE);
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
      JETTY_ERROR.Unauthorized
    );
  });
});
