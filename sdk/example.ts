import { PublicKey } from "@solana/web3.js";
import sdk from "./index";

async function demo() {
  const programId = new PublicKey("11111111111111111111111111111111");
  const mint = new PublicKey("22222222222222222222222222222222");
  const wallet = new PublicKey("33333333333333333333333333333333");

  const [hookConfigPda] = sdk.deriveHookConfigPda(mint, programId);
  const [extraMetaPda] = sdk.deriveExtraAccountMetaListPda(mint, programId);
  const [allowlistPda] = sdk.deriveAllowlistEntryPda(mint, wallet, programId);

  console.log("hookConfigPda:", hookConfigPda.toBase58());
  console.log("extraMetaPda:", extraMetaPda.toBase58());
  console.log("allowlistPda:", allowlistPda.toBase58());
}

demo().catch(console.error);
