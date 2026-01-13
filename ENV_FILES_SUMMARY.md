# 📋 Environment Variables Summary

## 🎯 File `.env.example` yang Dibutuhkan

### 1. **`contracts/.env.example`**

```env
# Private key of deployer account (NEVER commit this!)
# Get from MetaMask: Settings → Security & Privacy → Show Private Key
PRIVATE_KEY=your_private_key_here

# RPC URLs (optional - defaults provided)
# Get free RPC URLs from:
# - https://www.alchemy.com/ (recommended)
# - https://infura.io/
# - https://www.quicknode.com/

# Arbitrum Sepolia Testnet RPC (for testing - GRATIS!)
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
# Or use Alchemy/Infura for better reliability:
# ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Arbitrum One Mainnet RPC (for production)
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
# Or use Alchemy/Infura:
# ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

**Cara buat:**
```bash
cd contracts
# Copy template di atas ke file .env.example
```

---

### 2. **`frontend/.env.local.example`**

```env
# ============================================
# StylusArena Frontend - Environment Variables
# ============================================

# Contract Address (REQUIRED after deployment)
# This will be auto-updated after contract deployment
# Format: 0x... (42 characters)
NEXT_PUBLIC_STYLUS_ARENA_ADDRESS=0x0000000000000000000000000000000000000000
# Or use the old name (for compatibility):
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# WalletConnect Project ID (OPTIONAL)
# Get free Project ID from: https://cloud.walletconnect.com/
# If not set, will use MetaMask only (injected connector)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

**Cara buat:**
```bash
cd frontend
# Copy template di atas ke file .env.local.example
```

---

### 3. **`backend-ts/.env.example`**

```env
# ============================================
# StylusArena Backend - Environment Variables
# ============================================

# Server Configuration
PORT=8000
NODE_ENV=development
LOG_LEVEL=info

# ============================================
# Optional: AI Features
# ============================================

# OpenAI API Key (for future AI code generation features)
# Get from: https://platform.openai.com/api-keys
# If not set, will use mock code generation
OPENAI_API_KEY=sk-your_openai_api_key_here

# ============================================
# Optional: Notifications
# ============================================

# Slack Webhook URL (for notifications)
# Get from: Slack App → Incoming Webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Discord Webhook URL (for notifications)
# Get from: Discord Server → Integrations → Webhooks
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL

# ============================================
# Optional: Contract Deployment
# ============================================

# Private key for contract deployment (if backend needs to deploy)
# Same format as contracts/.env
DEPLOY_PRIVATE_KEY=your_private_key_here
```

**Cara buat:**
```bash
cd backend-ts
# Copy template di atas ke file .env.example
```

---

## 🚀 Quick Setup Commands

### Create All .env.example Files:

```bash
# 1. Contracts
cd contracts
cat > .env.example << 'EOF'
PRIVATE_KEY=your_private_key_here
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
EOF

# 2. Frontend
cd ../frontend
cat > .env.local.example << 'EOF'
NEXT_PUBLIC_STYLUS_ARENA_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
EOF

# 3. Backend
cd ../backend-ts
cat > .env.example << 'EOF'
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
OPENAI_API_KEY=sk-your_openai_api_key_here
EOF
```

### Windows PowerShell:

```powershell
# 1. Contracts
cd contracts
@"
PRIVATE_KEY=your_private_key_here
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
"@ | Out-File -FilePath .env.example -Encoding utf8

# 2. Frontend
cd ..\frontend
@"
NEXT_PUBLIC_STYLUS_ARENA_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
"@ | Out-File -FilePath .env.local.example -Encoding utf8

# 3. Backend
cd ..\backend-ts
@"
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
OPENAI_API_KEY=sk-your_openai_api_key_here
"@ | Out-File -FilePath .env.example -Encoding utf8
```

---

## 📝 Required vs Optional

### ✅ **Required (Must Have):**

1. **`contracts/.env`**:
   - `PRIVATE_KEY` - Untuk deploy contract

2. **`frontend/.env.local`**:
   - `NEXT_PUBLIC_STYLUS_ARENA_ADDRESS` - Akan di-update otomatis setelah deployment

### ⚠️ **Optional (Nice to Have):**

1. **`contracts/.env`**:
   - `ARBITRUM_SEPOLIA_RPC_URL` - Default sudah ada
   - `ARBITRUM_RPC_URL` - Default sudah ada

2. **`frontend/.env.local`**:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - MetaMask works without it

3. **`backend-ts/.env`**:
   - Semua optional! Default values sudah cukup

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

### 🔐 Best Practices:
1. **Never share private keys** - Keep them secret!
2. **Use testnet for development** - Free and safe
3. **Check `.gitignore`** - Ensure `.env` files are ignored

---

## 📚 Full Documentation

Lihat **`ENV_SETUP_GUIDE.md`** untuk:
- Detailed setup instructions
- Troubleshooting guide
- Security best practices
- Testnet setup guide

---

**Setup complete!** 🚀


