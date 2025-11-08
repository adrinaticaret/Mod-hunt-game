## CARV Blockchain Connection Guide

## Installation and Setup

### 1️⃣ Prerequisites
To use blockchain features, you need:
- **Solana-compatible Wallet** (e.g., Phantom or Solflare)
- **CARV Testnet SOL** for transaction fees

### 2️⃣ Wallet Connection
1. Install a wallet extension (Phantom recommended)
2. Click the "Select Wallet" button in the top-right corner of the page
3. Select your wallet and confirm the connection
4. Your wallet will connect to the CARV Testnet

### 3️⃣ Get Test SOL
To use blockchain features, you need some SOL:
1. Go to [CARV Bridge](https://bridge.testnet.carv.io)
2. Enter your wallet address
3. Request Test SOL
4. Wait for confirmation (usually a few seconds)

### 4️⃣ Blockchain Features

#### 🎮 Transaction on Mod Discovery
Each time you find a Mod:
- An on-chain transaction is sent to CARV Testnet
- Memo containing event information
- Transaction signature displayed in toast
- You can view the transaction in CARV Explorer

#### 🏆 NFT Win
When you win the game (find all 3 Mods):
- A "Victory Champion" NFT is minted for you
- NFT includes your game stats (HP, Mods Found, Tiles Revealed)
- NFT is sent to your wallet
- You can view the NFT in CARV Explorer

### 5️⃣ Edge Function Settings
For developers, these environment variables are required:
```bash
# In Supabase Dashboard > Settings > Edge Functions > Secrets
NFT_MINT_AUTHORITY_PRIVATE_KEY=[1,2,3,...] # JSON array of private key bytes
TREASURY_WALLET_ADDRESS=YourWalletAddressHere
```

#### Generate New Keypair

```typescript
import { Keypair } from '@solana/web3.js';
const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toString());
console.log('Secret Key:', JSON.stringify(Array.from(keypair.secretKey)));
```

### 6️⃣ Useful Links

- **CARV RPC**: `https://rpc.testnet.carv.io/rpc`
- **CARV Explorer**: https://explorer.testnet.carv.io
- **CARV Bridge**: https://bridge.testnet.carv.io
- **CARV Docs**: https://docs.carv.io

###🔧 Troubleshooting
"Insufficient SOL balance"

Go to CARV Bridge and get Test SOL
You need at least 0.01 SOL for transaction fees

"Wallet not connected"

Ensure wallet extension is installed
Click "Select Wallet" button and reconnect

"Transaction failed"

Check CARV Testnet network
Check your SOL balance
Check your internet connection

###📝 Notes

All transactions are on CARV Testnet (no real value)
If wallet is not connected, the game works normally
Blockchain features are optional
All transactions are async and do not block the game

🎯 Technical Architecture

```
[Client] --> [Wallet Adapter] --> [CARV RPC]
    |              |                   |
    |              v                   v
    |        [Sign Transaction]   [Confirm Tx]
    |                                  |
    v                                  v
[Edge Function] ----------------> [Mint NFT]
```

For more questions, refer to CARV [Documentation](https://docs.carv.io/).
