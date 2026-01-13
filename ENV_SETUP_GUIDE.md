# 🔧 Environment Variables Setup Guide

## 📋 Overview

StylusArena menggunakan 3 file `.env` untuk konfigurasi:
1. **`contracts/.env`** - Contract deployment
2. **`frontend/.env.local`** - Frontend configuration
3. **`backend-ts/.env`** - Backend API configuration

---

## 🚀 Quick Setup

### Step 1: Contracts (Required for deployment)

```bash
cd contracts
cp .env.example .env
```

**Edit `contracts/.env`:**
```env
PRIVATE_KEY=your_metamask_private_key_here
# Optional: Custom RPC URLs
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
```

**Cara dapat PRIVATE_KEY:**
1. Buka MetaMask
2. Settings → Security & Privacy
3. Show Private Key
4. Copy (tanpa 0x prefix)

---

### Step 2: Frontend (Required after deployment)

```bash
cd frontend
cp .env.local.example .env.local
```

**Edit `frontend/.env.local`:**
```env
NEXT_PUBLIC_STYLUS_ARENA_ADDRESS=0x... # Akan di-update setelah deploy
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id # Optional
```

**Cara dapat WalletConnect Project ID (Optional):**
1. Daftar di https://cloud.walletconnect.com/
2. Create new project
3. Copy Project ID

**Note:** Deployment script akan otomatis update `NEXT_PUBLIC_STYLUS_ARENA_ADDRESS`!

---

### Step 3: Backend (Optional)

```bash
cd backend-ts
cp .env.example .env
```

**Edit `backend-ts/.env`:**
```env
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
# Optional:
OPENAI_API_KEY=sk-... # Untuk AI features
```

---

## 📝 Environment Variables Reference

### Contracts (`.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PRIVATE_KEY` | ✅ Yes | Deployer wallet private key | `abc123...` |
| `ARBITRUM_SEPOLIA_RPC_URL` | ⚠️ Optional | Testnet RPC URL | `https://sepolia-rollup.arbitrum.io/rpc` |
| `ARBITRUM_RPC_URL` | ⚠️ Optional | Mainnet RPC URL | `https://arb1.arbitrum.io/rpc` |

**Default RPC URLs:**
- Testnet: `https://sepolia-rollup.arbitrum.io/rpc`
- Mainnet: `https://arb1.arbitrum.io/rpc`

**Better RPC Providers (Free):**
- Alchemy: https://www.alchemy.com/
- Infura: https://infura.io/
- QuickNode: https://www.quicknode.com/

---

### Frontend (`.env.local`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_STYLUS_ARENA_ADDRESS` | ✅ Yes* | Contract address | `0x1234...5678` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ⚠️ Optional | WalletConnect Project ID | `abc123...` |

**Note:** 
- `NEXT_PUBLIC_STYLUS_ARENA_ADDRESS` akan di-update otomatis setelah deployment
- Jika tidak ada, akan fallback ke MetaMask only
- `NEXT_PUBLIC_*` variables exposed ke browser (safe untuk contract address)

---

### Backend (`.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | ⚠️ Optional | Server port | `8000` |
| `NODE_ENV` | ⚠️ Optional | Environment | `development` |
| `LOG_LEVEL` | ⚠️ Optional | Log level | `info` |
| `OPENAI_API_KEY` | ⚠️ Optional | OpenAI API key | - |
| `SLACK_WEBHOOK_URL` | ⚠️ Optional | Slack notifications | - |
| `DISCORD_WEBHOOK_URL` | ⚠️ Optional | Discord notifications | - |
| `DEPLOY_PRIVATE_KEY` | ⚠️ Optional | For backend deployment | - |

**Log Levels:**
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, errors (recommended)
- `debug` - All logs

---

## 🔒 Security Notes

### ✅ Safe to Commit:
- `.env.example` files
- `.env.local.example` files
- This guide

### ❌ NEVER Commit:
- `.env` files
- `.env.local` files
- Private keys
- API keys
- Wallet addresses with funds

### 🔐 Best Practices:
1. **Never share private keys** - Keep them secret!
2. **Use testnet for development** - Free and safe
3. **Rotate keys regularly** - If exposed, change immediately
4. **Use environment-specific files** - `.env.local` for local dev
5. **Check `.gitignore`** - Ensure `.env` files are ignored

---

## 🧪 Testnet Setup (Recommended)

### Get Testnet ETH (FREE):

1. **Arbitrum Sepolia Faucet:**
   - https://sepoliafaucet.com/
   - https://faucet.quicknode.com/arbitrum/sepolia
   - https://faucets.chain.link/arbitrum-sepolia

2. **Add Arbitrum Sepolia to MetaMask:**
   - Network Name: `Arbitrum Sepolia`
   - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
   - Chain ID: `421614`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.arbiscan.io/`

3. **Request Testnet ETH:**
   - Connect wallet to faucet
   - Request 0.1 ETH (enough for many transactions)
   - **100% FREE!** 💰

---

## 🚀 Deployment Flow

### 1. Setup Environment:
```bash
# Contracts
cd contracts
cp .env.example .env
# Add PRIVATE_KEY

# Frontend
cd ../frontend
cp .env.local.example .env.local
# Will be auto-updated after deployment
```

### 2. Deploy Contract:
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

**Deployment script akan:**
- ✅ Deploy contract
- ✅ Save address to `contracts/.env`
- ✅ Auto-update `frontend/.env.local` with `NEXT_PUBLIC_STYLUS_ARENA_ADDRESS`

### 3. Verify:
```bash
# Check frontend/.env.local
cat frontend/.env.local
# Should show: NEXT_PUBLIC_STYLUS_ARENA_ADDRESS=0x...
```

---

## ❓ Troubleshooting

### Problem: "PRIVATE_KEY not found"
**Solution:** 
- Check `contracts/.env` exists
- Verify PRIVATE_KEY format (no 0x prefix needed)
- Ensure no extra spaces

### Problem: "Contract address is 0x0000..."
**Solution:**
- Deploy contract first: `npx hardhat run scripts/deploy.js --network arbitrumSepolia`
- Check `frontend/.env.local` is updated
- Restart frontend dev server

### Problem: "WalletConnect not working"
**Solution:**
- Optional! MetaMask works without WalletConnect
- Or get free Project ID from https://cloud.walletconnect.com/
- Add to `frontend/.env.local`

### Problem: "Backend not starting"
**Solution:**
- Check `backend-ts/.env` exists
- Verify PORT is not in use
- Check NODE_ENV is valid (development/production/test)

---

## 📚 Additional Resources

- **Arbitrum Docs:** https://docs.arbitrum.io/
- **Hardhat Docs:** https://hardhat.org/docs
- **Next.js Env Vars:** https://nextjs.org/docs/basic-features/environment-variables
- **WalletConnect:** https://docs.walletconnect.com/

---

**Setup complete! Ready to deploy!** 🚀

