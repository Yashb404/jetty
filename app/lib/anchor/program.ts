import { Program } from "@coral-xyz/anchor";
import { Jetty } from "./jetty";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl.json";

// The program ID from the IDL or compiled on-chain program
export const PROGRAM_ID = new PublicKey(idl.address);

/**
 * Get the Jetty program instance using a given connection and wallet adapter provider.
 */
export function getJettyProgram(connection: Connection, anchorProvider: unknown): Program<Jetty> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as unknown as Jetty, anchorProvider as any);
}
