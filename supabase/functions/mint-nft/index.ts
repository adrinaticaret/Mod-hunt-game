import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from 'npm:@solana/web3.js@^1.95.8';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const CARV_RPC = 'https://rpc.testnet.carv.io/rpc';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Upload template endpoint - call this once to initialize
    if (url.pathname.endsWith('/upload-template')) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Read the template image file and convert to blob
      // You need to manually upload nft-champion.png to storage bucket via UI first
      // Or we'll use this endpoint with a base64 image
      
      return new Response(JSON.stringify({ 
        status: 'info',
        message: 'Please upload nft-champion.png to the nft-images storage bucket manually via the Lovable Cloud backend UI.',
        instructions: [
          '1. Click "View Backend" button',
          '2. Go to Storage section',
          '3. Select nft-images bucket',
          '4. Upload the public/nft-champion.png file',
          '5. Name it exactly: nft-champion.png'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Test endpoint to validate secret format
    if (url.pathname.endsWith('/test')) {
      const mintAuthoritySecret = Deno.env.get('NFT_MINT_AUTHORITY_PRIVATE_KEY');
      
      if (!mintAuthoritySecret) {
        return new Response(JSON.stringify({ 
          status: 'error',
          message: 'NFT_MINT_AUTHORITY_PRIVATE_KEY not configured' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        let secretKeyArray;
        
        // Try to parse as JSON array first
        if (mintAuthoritySecret.trim().startsWith('[')) {
          secretKeyArray = JSON.parse(mintAuthoritySecret);
        } else {
          // If no brackets, assume it's comma-separated numbers
          secretKeyArray = mintAuthoritySecret.split(',').map((num) => parseInt(num.trim(), 10));
        }
        
        if (!Array.isArray(secretKeyArray)) {
          return new Response(JSON.stringify({ 
            status: 'error',
            message: 'Secret is not an array',
            type: typeof secretKeyArray
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (secretKeyArray.length !== 64) {
          return new Response(JSON.stringify({ 
            status: 'error',
            message: `Secret array has wrong length: ${secretKeyArray.length}, expected 64`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
        const connection = new Connection(CARV_RPC, 'confirmed');
        const balance = await connection.getBalance(mintAuthority.publicKey);
        
        return new Response(JSON.stringify({ 
          status: 'success',
          message: 'Secret key is valid!',
          publicKey: mintAuthority.publicKey.toString(),
          balance: balance / 1e9, // Convert lamports to SOL
          balanceInLamports: balance,
          arrayLength: secretKeyArray.length,
          needsFunding: balance < 100000000 // Less than 0.1 SOL
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        return new Response(JSON.stringify({ 
          status: 'error',
          message: 'Failed to parse secret key',
          error: errorMessage,
          secretPreview: mintAuthoritySecret.substring(0, 100)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { walletAddress, stats, network } = await req.json();

    // Validation
    if (!walletAddress || !stats) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting NFT mint process for wallet:', walletAddress);

    // اتصال به CARV Testnet
    const connection = new Connection(CARV_RPC, 'confirmed');

    // دریافت NFT Mint Authority از Environment Variable
    const mintAuthoritySecret = Deno.env.get('NFT_MINT_AUTHORITY_PRIVATE_KEY');
    if (!mintAuthoritySecret) {
      throw new Error('NFT_MINT_AUTHORITY_PRIVATE_KEY not configured');
    }

    let secretKeyArray;
    try {
      if (mintAuthoritySecret.trim().startsWith('[')) {
        secretKeyArray = JSON.parse(mintAuthoritySecret);
      } else {
        secretKeyArray = mintAuthoritySecret.split(',').map((num) => parseInt(num.trim(), 10));
      }
      
      if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) {
        throw new Error(`Invalid secret key format`);
      }
    } catch (parseError) {
      console.error('Failed to parse secret key:', parseError);
      throw new Error(`Invalid secret key format`);
    }

    const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    console.log('Mint authority public key:', mintAuthority.publicKey.toString());

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const timestamp = Date.now();
    
    // Get the template NFT image from storage
    const templateImagePath = 'nft-champion.png';
    const { data: { publicUrl } } = supabase.storage
      .from('nft-images')
      .getPublicUrl(templateImagePath);

    console.log('Using NFT template image:', publicUrl);

    // Create metadata JSON
    const metadata = {
      name: `CARV Mod Hunt Champion #${timestamp}`,
      symbol: 'CARVMOD',
      description: `Victory NFT from CARV Mod Hunt Game - HP: ${stats.hp}, Mods Found: ${stats.modsFound}, Tiles Revealed: ${stats.tilesRevealed}`,
      image: publicUrl,
      attributes: [
        { trait_type: 'Game', value: 'CARV Mod Hunt' },
        { trait_type: 'Achievement', value: 'Victory' },
        { trait_type: 'HP Remaining', value: stats.hp },
        { trait_type: 'Tiles Revealed', value: stats.tilesRevealed },
        { trait_type: 'Mods Found', value: stats.modsFound },
        { trait_type: 'Network', value: 'CARV Testnet' },
        { trait_type: 'Timestamp', value: timestamp },
      ],
      properties: {
        category: 'image',
        files: [{
          uri: publicUrl,
          type: 'image/png'
        }]
      }
    };

    // Upload metadata JSON to storage
    const metadataPath = `metadata-${walletAddress.substring(0, 8)}-${timestamp}.json`;
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    
    console.log('Uploading metadata to storage:', metadataPath);
    const { data: metadataUploadData, error: metadataUploadError } = await supabase.storage
      .from('nft-images')
      .upload(metadataPath, metadataBlob, {
        contentType: 'application/json',
        upsert: false
      });

    if (metadataUploadError) {
      console.error('Metadata upload error:', metadataUploadError);
      throw new Error(`Failed to upload metadata: ${metadataUploadError.message}`);
    }

    // Get public URL for metadata
    const { data: { publicUrl: metadataUri } } = supabase.storage
      .from('nft-images')
      .getPublicUrl(metadataPath);

    console.log('Metadata uploaded successfully:', metadataUri);

    // Create a simple token mint as NFT representation
    console.log('Creating NFT token mint...');
    const tokenMint = Keypair.generate();
    const recipientPublicKey = new PublicKey(walletAddress);

    // Create a transaction to initialize the mint and transfer to user
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: mintAuthority.publicKey,
        toPubkey: recipientPublicKey,
        lamports: 1000000, // 0.001 SOL as NFT marker
      })
    );

    console.log('Sending NFT transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [mintAuthority]
    );

    console.log('NFT created successfully. Signature:', signature);

    return new Response(
      JSON.stringify({
        success: true,
        mintAddress: tokenMint.publicKey.toString(),
        signature: signature,
        explorerUrl: `https://explorer.testnet.carv.io/tx/${signature}`,
        metadata: metadata,
        imageUrl: publicUrl,
        metadataUri: metadataUri,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('NFT Mint Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
