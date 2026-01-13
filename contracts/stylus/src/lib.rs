//! StylusArena AI Agent Registry
//!
//! Manages AI agents trained through gaming on Arbitrum.

#![cfg_attr(not(feature = "export-abi"), no_main)]
#![cfg_attr(not(feature = "export-abi"), no_std)]
extern crate alloc;

use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
    msg, block,
};

sol_storage! {
    #[entrypoint]
    pub struct AgentRegistry {
        uint256 total_agents;
        address owner;
        uint256 fee;
        mapping(uint256 => address) agent_owners;
        mapping(uint256 => uint256) agent_types;
        mapping(uint256 => uint256) agent_scores;
        mapping(uint256 => bool) agent_active;
    }
}

#[public]
impl AgentRegistry {
    /// Initialize contract
    pub fn init(&mut self) {
        if self.owner.get() == Address::ZERO {
            self.owner.set(msg::sender());
            self.fee.set(U256::from(1_000_000_000_000_000_u64));
        }
    }

    /// Register new agent
    #[payable]
    pub fn register(&mut self, game_type: U256) -> U256 {
        let id = self.total_agents.get() + U256::from(1);
        self.total_agents.set(id);
        
        self.agent_owners.setter(id).set(msg::sender());
        self.agent_types.setter(id).set(game_type);
        self.agent_scores.setter(id).set(U256::from(5000));
        self.agent_active.setter(id).set(true);
        
        id
    }

    /// Update score
    pub fn update_score(&mut self, id: U256, score: U256) {
        if self.agent_owners.get(id) == msg::sender() {
            self.agent_scores.setter(id).set(score);
        }
    }

    /// Deactivate agent
    pub fn deactivate(&mut self, id: U256) {
        if self.agent_owners.get(id) == msg::sender() {
            self.agent_active.setter(id).set(false);
        }
    }

    /// Get owner
    pub fn get_owner(&self, id: U256) -> Address {
        self.agent_owners.get(id)
    }

    /// Get score
    pub fn get_score(&self, id: U256) -> U256 {
        self.agent_scores.get(id)
    }

    /// Check active
    pub fn is_active(&self, id: U256) -> bool {
        self.agent_active.get(id)
    }

    /// Total agents
    pub fn total(&self) -> U256 {
        self.total_agents.get()
    }

    /// Get fee
    pub fn get_fee(&self) -> U256 {
        self.fee.get()
    }
}
