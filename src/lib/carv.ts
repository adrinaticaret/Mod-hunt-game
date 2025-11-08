import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { Buffer } from 'buffer';

// CARV Testnet Configuration
export const CARV_RPC = 'https://rpc.testnet.carv.io/rpc';
export const CARV_EXPLORER = 'https://explorer.testnet.carv.io';

// Treasury wallet برای دریافت transaction fees
// این یک آدرس نمونه است - می‌توانید با آدرس wallet خود جایگزین کنید
const TREASURY_WALLET = new PublicKey('GUFxwdRKebs4FN8bYSeZFgMp1VYD7Yp8bBCt9nGEaYTw');

/**
 * اتصال به CARV Testnet
 */
export const getCarvConnection = () => {
  return new Connection(CARV_RPC, 'confirmed');
};

/**
 * ارسال تراکنش هنگام پیدا کردن Mod
 * مقدار کمی SOL + memo ارسال می‌شود
 * 
 * استراتژی "Fire and Forget":
 * - بلافاصله signature برگردانده می‌شود
 * - confirmation در background بررسی می‌شود
 * - UI منتظر confirmation نمی‌ماند
 */
export const sendModFoundTransaction = async (
  wallet: WalletContextState,
  modNumber: number
): Promise<string> => {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    console.log('🔄 Starting transaction for Mod #', modNumber);
    console.log('👛 Wallet address:', wallet.publicKey.toBase58());

    const connection = getCarvConnection();

    // ساخت تراکنش
    const transaction = new Transaction();

    // 1. Transfer مقدار کمی SOL (0.001 SOL = 1,000,000 lamports)
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: TREASURY_WALLET,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    });

    // 2. اضافه کردن Memo (استفاده از TextEncoder برای سازگاری با مرورگر)
    const memoText = `CARV Mod Hunt - Mod #${modNumber} Found! 🎮`;
    const memoData = new TextEncoder().encode(memoText);
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(memoData),
    });

    transaction.add(transferInstruction, memoInstruction);

    console.log('📡 Getting blockhash...');
    // دریافت recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    console.log('✍️ Signing transaction...');
    // امضا و ارسال
    const signed = await wallet.signTransaction(transaction);
    
    console.log('📤 Sending transaction...');
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    console.log('✅ Transaction sent! Signature:', signature);

    // بررسی confirmation در background (بدون block کردن)
    // UI منتظر این نمی‌ماند
    connection.confirmTransaction(signature, 'finalized').then(() => {
      console.log(`✅ Transaction confirmed: ${signature}`);
    }).catch((error) => {
      console.warn(`⚠️ Transaction confirmation timeout (but transaction was sent): ${signature}`, error);
    });

    // بلافاصله signature را برمی‌گردانیم
    return signature;
  } catch (error: any) {
    console.error('❌ Transaction error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      logs: error.logs,
    });
    throw error;
  }
};

/**
 * درخواست Mint NFT از Edge Function
 */
export const requestNFTMint = async (
  walletAddress: string,
  gameStats: { hp: number; tilesRevealed: number; modsFound: number }
): Promise<{ signature: string; mintAddress: string; explorerUrl: string }> => {
  const { data, error } = await supabase.functions.invoke('mint-nft', {
    body: {
      walletAddress,
      stats: gameStats,
      network: 'carv-testnet',
    },
  });

  if (error) {
    console.error('NFT Mint Error:', error);
    throw new Error(error.message || 'Failed to mint NFT');
  }

  return data;
};

/**
 * بررسی موجودی SOL
 */
export const checkBalance = async (publicKey: PublicKey): Promise<number> => {
  const connection = getCarvConnection();
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
};

/**
 * لینک به CARV Explorer
 */
export const getExplorerLink = (signature: string): string => {
  return `${CARV_EXPLORER}/tx/${signature}`;
};
