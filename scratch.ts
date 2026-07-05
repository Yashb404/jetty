import { BorshCoder } from '@coral-xyz/anchor';
import idl from './app/lib/anchor/idl.json';

const coder = new BorshCoder(idl as any);

const ix = coder.instruction.encode('update_policy', {
  args: {
    vesting_enabled: true,
    paused: null,
    allowlist_enabled: null,
    max_transfer_amount: null,
    min_transfer_amount: null,
    max_holder_bps: null,
    denylist_enabled: null,
    cooldown_seconds: null,
  }
});

const decoded = coder.instruction.decode(ix, 'base58');
console.log(JSON.stringify(decoded));
