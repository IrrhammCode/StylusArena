#!/bin/bash
source ~/.cargo/env
cd /mnt/d/code/StylusArena/contracts/stylus

ENV_FILE="/mnt/d/code/StylusArena/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Robust extraction: use awk to find line starting with PRIVATE_KEY and split by =
PRIVATE_KEY=$(awk -F '=' '/^\s*PRIVATE_KEY/ {print $2}' "$ENV_FILE" | head -n 1 | tr -d '\r' | xargs)

# Trim whitespace
PRIVATE_KEY=$(echo "$PRIVATE_KEY" | xargs)

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not found or empty in $ENV_FILE"
    exit 1
fi

RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

echo "Deploying to Arbitrum Sepolia..."
echo "RPC: $RPC_URL"
echo "Key length: ${#PRIVATE_KEY}"

# Run deploy
cargo stylus deploy --private-key "$PRIVATE_KEY" --endpoint "$RPC_URL"
