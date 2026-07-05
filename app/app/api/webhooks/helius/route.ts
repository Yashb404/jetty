import { NextResponse } from 'next/server';
import client from '../../../../lib/db';
import { BorshCoder, utils } from '@coral-xyz/anchor';
import idl from '../../../../lib/anchor/idl.json';
import crypto from 'crypto';

const PROGRAM_ID = "4DcxDMd7iFppUn6aGkuJY3xNaF9FFNduchqByYmXiKku";
const coder = new BorshCoder(idl as any);

export async function POST(request: Request) {
  // 1. Verify Authorization Header (Helius sends this)
  const authHeader = request.headers.get('Authorization') || '';
  const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim();
  const expectedSecret = process.env.HELIUS_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use timing-safe comparison to prevent timing attacks
  let isAuthorized = false;
  try {
    const providedBuffer = Buffer.from(providedSecret);
    const expectedBuffer = Buffer.from(expectedSecret);
    if (providedBuffer.length === expectedBuffer.length) {
      isAuthorized = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    }
  } catch (e) {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();

    // 2. Parse the EnrichedTransaction array sent by Helius
    for (const tx of payload) {
      if (!tx.instructions) continue;

      const signature = tx.signature || "UnknownTx";

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

          const ixDef = idl.instructions.find((i: any) => i.name === decoded.name);
          if (!ixDef) continue;

          const getAccount = (name: string) => {
            const idx = ixDef.accounts.findIndex((a: any) => a.name === name);
            return idx !== -1 ? ix.accounts[idx] : undefined;
          };

          targetMint = getAccount('mint') || "Unknown";
          const policyAuthority = getAccount('policy_authority');
          const walletPubkey = policyAuthority || tx.feePayer || "UnknownWallet";
          
          if (tx.feePayer && policyAuthority && tx.feePayer !== policyAuthority) {
            details.feePayer = tx.feePayer;
          }

          // Anchor Instructions pack accounts sequentially in the IDL order
          // We can map these directly to extract the targeted mint and parameters
          const data = decoded.data as any;

          if (actionName === 'initialize_hook_config') {
            actionName = 'Initialize Config';
          } else if (actionName === 'update_policy') {
            actionName = 'Update Policy';
            const args = data.args || {};

            if (args.paused != null) details.paused = args.paused;
            if (args.allowlist_enabled != null) details.allowlistEnabled = args.allowlist_enabled;
            if (args.max_transfer_amount != null) details.maxTransferAmount = args.max_transfer_amount.toString();
            if (args.vesting_enabled != null) details.vestingEnabled = args.vesting_enabled;
            if (args.min_transfer_amount != null) details.minTransferAmount = args.min_transfer_amount.toString();
            if (args.max_holder_bps != null) details.maxHolderBps = args.max_holder_bps;
            if (args.denylist_enabled != null) details.denylistEnabled = args.denylist_enabled;
            if (args.cooldown_seconds != null) details.cooldownSeconds = args.cooldown_seconds;
          } else if (actionName === 'update_allowlist') {
            actionName = 'Update Allowlist';
            details.tokenAccount = getAccount('token_account');
            details.active = data.active;
          } else if (actionName === 'init_extra_account_meta_list') {
            actionName = 'Register Extra Accounts';
          } else {
            continue; // Unhandled action
          }

          // 3. Securely insert the parsed, verified on-chain action into Turso (Idempotent)
          await client.execute({
            sql: `
              INSERT INTO history_logs (wallet_pubkey, action_type, target_mint, details)
              SELECT ?, ?, ?, ?
              WHERE NOT EXISTS (
                SELECT 1 FROM history_logs 
                WHERE json_extract(details, '$.tx') = ? AND action_type = ?
              )
            `,
            args: [
              walletPubkey, actionName, targetMint, JSON.stringify(details),
              signature, actionName
            ]
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
