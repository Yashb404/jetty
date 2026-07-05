import { NextResponse } from 'next/server';
import client from '../../../../lib/db';
import { BorshCoder, utils } from '@coral-xyz/anchor';
import idl from '../../../../lib/anchor/idl.json';

const PROGRAM_ID = "4DcxDMd7iFppUn6aGkuJY3xNaF9FFNduchqByYmXiKku";

export async function POST(request: Request) {
  // 1. Verify Authorization Header (Helius sends this)
  const authHeader = request.headers.get('Authorization');
  if (process.env.HELIUS_WEBHOOK_SECRET && authHeader !== process.env.HELIUS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const coder = new BorshCoder(idl as any);

    // 2. Parse the EnrichedTransaction array sent by Helius
    for (const tx of payload) {
      if (!tx.instructions) continue;

      const signature = tx.signature || tx.transactionError?.signature || "UnknownTx";
      const walletPubkey = tx.feePayer || "UnknownWallet";

      for (const ix of tx.instructions) {
        // Only process instructions targeted at our Jetty program
        if (ix.programId !== PROGRAM_ID) continue;

        try {
          // Helius sends ix.data as a base58 string
          const ixBuffer = Buffer.from(utils.bytes.bs58.decode(ix.data));
          const decoded = coder.instruction.decode(ixBuffer, 'base58');
          
          if (!decoded) continue;

          let targetMint = "Unknown";
          let details: any = { tx: signature };
          let actionName = decoded.name;

          // Anchor Instructions pack accounts sequentially in the IDL order
          // We can map these directly to extract the targeted mint and parameters
          const data = decoded.data as any;

          if (actionName === 'initialize_hook_config') {
            actionName = 'Initialize Config';
            targetMint = ix.accounts[2];
          } else if (actionName === 'update_policy') {
            actionName = 'Update Policy';
            targetMint = ix.accounts[2];
            const args = data.args || {};
            if (args.paused !== null && args.paused !== undefined) details.paused = args.paused;
            if (args.allowlistEnabled !== null && args.allowlistEnabled !== undefined) details.allowlistEnabled = args.allowlistEnabled;
            if (args.maxTransferAmount !== null && args.maxTransferAmount !== undefined) details.maxTransferAmount = args.maxTransferAmount.toString();
            if (args.vestingEnabled !== null && args.vestingEnabled !== undefined) details.vestingEnabled = args.vestingEnabled;
            if (args.minTransferAmount !== null && args.minTransferAmount !== undefined) details.minTransferAmount = args.minTransferAmount.toString();
            if (args.maxHolderBps !== null && args.maxHolderBps !== undefined) details.maxHolderBps = args.maxHolderBps;
            if (args.denylistEnabled !== null && args.denylistEnabled !== undefined) details.denylistEnabled = args.denylistEnabled;
            if (args.cooldownSeconds !== null && args.cooldownSeconds !== undefined) details.cooldownSeconds = args.cooldownSeconds;
          } else if (actionName === 'update_allowlist') {
            actionName = 'Update Allowlist';
            targetMint = ix.accounts[2];
            details.tokenAccount = ix.accounts[3];
            details.active = data.active;
          } else if (actionName === 'init_extra_account_meta_list') {
            actionName = 'Register Extra Accounts';
            targetMint = ix.accounts[2];
          } else {
            continue; // Unhandled action
          }

          // 3. Securely insert the parsed, verified on-chain action into Turso
          await client.execute({
            sql: `
              INSERT INTO history_logs (wallet_pubkey, action_type, target_mint, details)
              VALUES (?, ?, ?, ?)
            `,
            args: [walletPubkey, actionName, targetMint, JSON.stringify(details)]
          });

        } catch (decodeErr) {
          console.error("Failed to decode instruction:", decodeErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
