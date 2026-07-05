use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, system_instruction},
};
use anchor_spl::token_2022::ID as TOKEN_2022_PROGRAM_ID;
use anchor_spl::token_interface::{Mint, TokenInterface};
use spl_tlv_account_resolution::state::ExtraAccountMetaList;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

use crate::{error::JettyError, state::HookConfig};

#[derive(Accounts)]
pub struct InitExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub policy_authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"policy", mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    /// CHECK: PDA allocated in handler as raw TLV data account.
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitExtraAccountMetaList>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.policy_authority.key(),
        ctx.accounts.hook_config.policy_authority,
        JettyError::Unauthorized
    );

    // Ensure the provided token program is the Token-2022 program.
    require_keys_eq!(
        ctx.accounts.token_program.key(),
        TOKEN_2022_PROGRAM_ID,
        JettyError::InvalidTokenProgram
    );

    let account_metas = crate::utils::build_extra_account_metas()?;
    let account_size = ExtraAccountMetaList::size_of(account_metas.len())?;
    let lamports = Rent::get()?.minimum_balance(account_size);
    let bump = ctx.bumps.extra_account_meta_list;
    let mint_key = ctx.accounts.mint.key();
    let signer_seeds: &[&[u8]] = &[b"extra-account-metas", mint_key.as_ref(), &[bump]];

    let extra_meta_info = ctx.accounts.extra_account_meta_list.to_account_info();

    if extra_meta_info.lamports() == 0 {
        let create_account_ix = system_instruction::create_account(
            &ctx.accounts.payer.key(),
            &extra_meta_info.key(),
            lamports,
            account_size as u64,
            &crate::ID,
        );
        invoke_signed(
            &create_account_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                extra_meta_info.clone(),
            ],
            &[signer_seeds],
        )?;
    } else {
        // Handle pre-funded or re-initialized accounts
        let required_lamports = lamports.saturating_sub(extra_meta_info.lamports());
        if required_lamports > 0 {
            let transfer_ix = system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &extra_meta_info.key(),
                required_lamports,
            );
            invoke_signed(
                &transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    extra_meta_info.clone(),
                ],
                &[], // No PDA seeds needed for payer
            )?;
        }

        // Only allocate and assign if the account is still owned by the system program
        if *extra_meta_info.owner == system_program::ID {
            let allocate_ix =
                system_instruction::allocate(&extra_meta_info.key(), account_size as u64);
            invoke_signed(&allocate_ix, &[extra_meta_info.clone()], &[signer_seeds])?;

            let assign_ix = system_instruction::assign(&extra_meta_info.key(), &crate::ID);
            invoke_signed(&assign_ix, &[extra_meta_info.clone()], &[signer_seeds])?;
        }
    }

    let mut data = extra_meta_info.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &account_metas)?;

    Ok(())
}
