pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
pub(crate) use instructions::assign_policy_authority::__client_accounts_assign_policy_authority;
pub(crate) use instructions::execute::__client_accounts_execute;
pub(crate) use instructions::init_extra_account_meta_list::__client_accounts_init_extra_account_meta_list;
pub(crate) use instructions::initialize_hook_config::__client_accounts_initialize_hook_config;
pub(crate) use instructions::update_allowlist::__client_accounts_update_allowlist;
pub(crate) use instructions::update_policy::__client_accounts_update_policy;
pub use instructions::{
    AssignPolicyAuthority, Execute, InitExtraAccountMetaList, InitializeHookConfig, UpdateAllowlist,
    UpdatePolicy, UpdatePolicyArgs,
};

declare_id!("4DcxDMd7iFppUn6aGkuJY3xNaF9FFNduchqByYmXiKku");

#[program]
pub mod jetty {
    use super::*;

    pub fn initialize_hook_config(ctx: Context<InitializeHookConfig>) -> Result<()> {
        instructions::initialize_hook_config::handler(ctx)
    }

    pub fn init_extra_account_meta_list(ctx: Context<InitExtraAccountMetaList>) -> Result<()> {
        instructions::init_extra_account_meta_list::handler(ctx)
    }

    #[instruction(discriminator = [105, 37, 101, 197, 75, 251, 102, 26])]
    pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
        instructions::execute::handler(ctx, amount)
    }

    pub fn update_policy(ctx: Context<UpdatePolicy>, args: UpdatePolicyArgs) -> Result<()> {
        instructions::update_policy::handler(ctx, args)
    }

    pub fn update_allowlist(ctx: Context<UpdateAllowlist>, active: bool) -> Result<()> {
        instructions::update_allowlist::handler(ctx, active)
    }

    pub fn assign_policy_authority(ctx: Context<AssignPolicyAuthority>) -> Result<()> {
        instructions::assign_policy_authority::handler(ctx)
    }
}
