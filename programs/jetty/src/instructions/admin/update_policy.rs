use anchor_lang::{
    prelude::*,
    solana_program::system_instruction,
};
use anchor_spl::token_interface::Mint;
use spl_tlv_account_resolution::state::ExtraAccountMetaList;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

use crate::{error::JettyError, state::HookConfig};

#[event]
pub struct PolicyUpdated {
    pub mint: Pubkey,
    pub paused: bool,
    pub allowlist_enabled: bool,
    pub max_transfer_amount: u64,
    pub vesting_enabled: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdatePolicyArgs {
    pub paused: Option<bool>,
    pub allowlist_enabled: Option<bool>,
    pub max_transfer_amount: Option<u64>,
    pub vesting_enabled: Option<bool>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub policy_authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: PDA validated in handler to ensure it belongs to the program
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdatePolicy>, args: UpdatePolicyArgs) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.policy_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    // Verify meta list owner (must be initialized by the program)
    require_keys_eq!(
        *ctx.accounts.extra_account_meta_list.owner,
        crate::ID,
        JettyError::InvalidMetaListOwner
    );

    let hook_config = &mut ctx.accounts.hook_config;
    if let Some(paused) = args.paused {
        hook_config.paused = paused;
    }
    if let Some(allowlist_enabled) = args.allowlist_enabled {
        hook_config.allowlist_enabled = allowlist_enabled;
    }
    if let Some(max_transfer_amount) = args.max_transfer_amount {
        hook_config.max_transfer_amount = max_transfer_amount;
    }
    if let Some(vesting_enabled) = args.vesting_enabled {
        hook_config.vesting_enabled = vesting_enabled;
    }

    // Build the new extra metas based on updated flags
    let metas = crate::utils::build_extra_account_metas(hook_config)?;
    let new_size = ExtraAccountMetaList::size_of(metas.len())?;
    
    let extra_meta_info = ctx.accounts.extra_account_meta_list.to_account_info();
    let old_size = extra_meta_info.data_len();

    let rent = Rent::get()?;
    let current_lamports = extra_meta_info.lamports();
    let required_lamports = rent.minimum_balance(new_size);

    if new_size >= old_size {
        // Growing: Top up rent if needed, then realloc, then update data
        if required_lamports > current_lamports {
            let lamports_to_transfer = required_lamports.saturating_sub(current_lamports);
            let transfer_ix = system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &extra_meta_info.key(),
                lamports_to_transfer,
            );
            anchor_lang::solana_program::program::invoke(
                &transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    extra_meta_info.clone(),
                ],
            )?;
        }
        
        extra_meta_info.resize(new_size)?;
        let mut data = extra_meta_info.try_borrow_mut_data()?;
        ExtraAccountMetaList::update::<ExecuteInstruction>(&mut data, &metas)?;
    } else {
        // Shrinking: Update data first, then realloc, then refund rent
        {
            let mut data = extra_meta_info.try_borrow_mut_data()?;
            ExtraAccountMetaList::update::<ExecuteInstruction>(&mut data, &metas)?;
        }
        extra_meta_info.resize(new_size)?;
        
        let excess_lamports = current_lamports.saturating_sub(required_lamports);
        if excess_lamports > 0 {
            extra_meta_info.sub_lamports(excess_lamports)?;
            ctx.accounts.payer.to_account_info().add_lamports(excess_lamports)?;
        }
    }

    emit!(PolicyUpdated {
        mint: hook_config.mint,
        paused: hook_config.paused,
        allowlist_enabled: hook_config.allowlist_enabled,
        max_transfer_amount: hook_config.max_transfer_amount,
        vesting_enabled: hook_config.vesting_enabled,
    });

    Ok(())
}
