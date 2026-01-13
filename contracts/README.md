# StylusArena Smart Contracts

## Overview

StylusArena menggunakan smart contracts di blockchain untuk menyimpan semua data on-chain, tanpa perlu database tradisional. Semua data user profiles, achievements, tournaments, battles, dan challenges disimpan di smart contract.

## Contract: StylusArena.sol

### Features

1. **User Profiles**
   - Username, level, XP
   - Game stats (games played, wins, losses)
   - Agent stats (trained, deployed)
   - Achievements unlocked
   - On-chain storage

2. **Achievements System**
   - Create achievements (owner only)
   - Unlock achievements untuk users
   - XP rewards otomatis
   - Category & rarity system

3. **Tournaments**
   - Create tournaments dengan prize pool
   - Join tournaments dengan entry fee
   - Participant tracking
   - Winner selection & prize distribution

4. **Agent Battles**
   - Create battles antara agents
   - Prize pools
   - Winner selection
   - Stats updates otomatis

5. **Challenges**
   - Daily/weekly/special challenges
   - Progress tracking
   - XP & token rewards
   - Auto-completion detection

## Deployment

### Prerequisites
- Hardhat atau Foundry
- Node.js & npm
- MetaMask atau wallet lain

### Steps

1. **Install Dependencies**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npm install @openzeppelin/contracts
   ```

2. **Compile**
   ```bash
   npx hardhat compile
   ```

3. **Deploy to Arbitrum**
   ```bash
   npx hardhat run scripts/deploy.js --network arbitrum
   ```

## Frontend Integration

Gunakan `wagmi` dan `viem` untuk interact dengan contract:

```typescript
import { useContractRead, useContractWrite } from 'wagmi'
import { stylusArenaABI } from './abis/stylusArena'

// Read user profile
const { data: profile } = useContractRead({
  address: STYLUS_ARENA_ADDRESS,
  abi: stylusArenaABI,
  functionName: 'getUserProfile',
  args: [userAddress]
})

// Write - create profile
const { write: createProfile } = useContractWrite({
  address: STYLUS_ARENA_ADDRESS,
  abi: stylusArenaABI,
  functionName: 'createProfile',
  args: [username]
})
```

## Contract Addresses

- **Arbitrum One**: `0x...` (akan diupdate setelah deploy)
- **Arbitrum Sepolia (Testnet)**: `0x...` (akan diupdate setelah deploy)

## Gas Optimization

- Struct packing untuk reduce storage costs
- Events untuk off-chain indexing
- Batch operations untuk multiple updates
- View functions untuk read-only operations

## Security Considerations

- Owner-only functions untuk admin operations
- Input validation
- Reentrancy protection (jika perlu)
- Access control checks

## Future Enhancements

- [ ] Upgradeable contracts (UUPS pattern)
- [ ] Multi-sig untuk owner functions
- [ ] Event indexing untuk better queries
- [ ] Layer 2 optimizations
- [ ] NFT achievements
- [ ] Token rewards system


