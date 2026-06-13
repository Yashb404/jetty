import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl.json";

// The program ID from the IDL or compiled on-chain program
export const PROGRAM_ID = new PublicKey(idl.address);

/**
 * Get the Jetty program instance using a given connection and wallet adapter provider.
 */
export function getJettyProgram(connection: Connection, anchorProvider: any): Program {
  // We cast the IDL to any to satisfy the Anchor Program signature which can vary between versions
  return new Program(idl as any, anchorProvider);
}
