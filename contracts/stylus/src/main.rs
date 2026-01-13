use stylus_agent_registry::AgentRegistry;

fn main() {
    #[cfg(feature = "export-abi")]
    stylus_sdk::abi::export::<AgentRegistry>();
}
