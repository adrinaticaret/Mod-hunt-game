# راهنمای اتصال به CARV Blockchain

## نصب و راه‌اندازی

### 1️⃣ پیش‌نیازها

برای استفاده از ویژگی‌های بلاکچین، شما نیاز دارید به:

- **Wallet متوافق با Solana** (مثل Phantom یا Solflare)
- **CARV Testnet SOL** برای پرداخت transaction fees

### 2️⃣ اتصال کیف پول

1. نصب یک wallet extension (Phantom توصیه می‌شود)
2. کلیک روی دکمه "Select Wallet" در گوشه بالای صفحه
3. انتخاب wallet خود و تأیید اتصال
4. Wallet شما به CARV Testnet متصل خواهد شد

### 3️⃣ دریافت Test SOL

برای استفاده از ویژگی‌های بلاکچین، به مقداری SOL نیاز دارید:

1. به [CARV Bridge](https://bridge.testnet.carv.io) بروید
2. آدرس wallet خود را وارد کنید
3. درخواست Test SOL کنید
4. منتظر تأیید بمانید (معمولاً چند ثانیه)

### 4️⃣ ویژگی‌های بلاکچین

#### 🎮 تراکنش هنگام پیدا کردن Mod

هر بار که یک Mod پیدا می‌کنید:
- یک تراکنش on-chain به CARV Testnet ارسال می‌شود
- Memo حاوی اطلاعات رویداد
- Transaction signature در toast نمایش داده می‌شود
- می‌توانید تراکنش را در CARV Explorer مشاهده کنید

#### 🏆 NFT برد

وقتی بازی را می‌برید (هر 3 Mod را پیدا کنید):
- یک NFT "Victory Champion" برای شما mint می‌شود
- NFT شامل آمار بازی شما (HP، Mods Found، Tiles Revealed)
- NFT به wallet شما ارسال می‌شود
- می‌توانید NFT را در CARV Explorer مشاهده کنید

### 5️⃣ تنظیمات Edge Function

برای توسعه‌دهندگان، این environment variables نیاز است:

```bash
# در Supabase Dashboard > Settings > Edge Functions > Secrets

NFT_MINT_AUTHORITY_PRIVATE_KEY=[1,2,3,...] # JSON array از private key bytes
TREASURY_WALLET_ADDRESS=YourWalletAddressHere
```

#### ساخت Keypair جدید

```typescript
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toString());
console.log('Secret Key:', JSON.stringify(Array.from(keypair.secretKey)));
```

### 6️⃣ لینک‌های مفید

- **CARV RPC**: `https://rpc.testnet.carv.io/rpc`
- **CARV Explorer**: https://explorer.testnet.carv.io
- **CARV Bridge**: https://bridge.testnet.carv.io
- **CARV Docs**: https://docs.carv.io

### 🔧 عیب‌یابی

#### "Insufficient SOL balance"
- به CARV Bridge بروید و Test SOL دریافت کنید
- حداقل 0.01 SOL برای transaction fees نیاز دارید

#### "Wallet not connected"
- مطمئن شوید wallet extension نصب است
- دکمه "Select Wallet" را کلیک کرده و دوباره اتصال برقرار کنید

#### "Transaction failed"
- شبکه CARV Testnet را چک کنید
- موجودی SOL خود را بررسی کنید
- اتصال اینترنت خود را بررسی کنید

### 📝 نکات

- همه تراکنش‌ها در CARV **Testnet** انجام می‌شود (بدون ارزش واقعی)
- اگر wallet متصل نباشد، بازی به صورت معمولی کار می‌کند
- ویژگی‌های blockchain اختیاری هستند
- همه تراکنش‌ها async هستند و بازی را block نمی‌کنند

### 🎯 معماری فنی

```
[Client] --> [Wallet Adapter] --> [CARV RPC]
    |              |                   |
    |              v                   v
    |        [Sign Transaction]   [Confirm Tx]
    |                                  |
    v                                  v
[Edge Function] ----------------> [Mint NFT]
```

برای سوالات بیشتر، به [مستندات CARV](https://docs.carv.io) مراجعه کنید.
