import { useState } from 'react';
import { Keypair } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Key, AlertTriangle } from 'lucide-react';

const GenerateKeypair = () => {
  const [keypair, setKeypair] = useState<{
    publicKey: string;
    secretArray: string;
    numbersOnly: string;
  } | null>(null);

  const generateNewKeypair = () => {
    const newKeypair = Keypair.generate();
    const secretArray = Array.from(newKeypair.secretKey);
    const numbersOnly = secretArray.join(',');
    
    setKeypair({
      publicKey: newKeypair.publicKey.toString(),
      secretArray: JSON.stringify(secretArray),
      numbersOnly: numbersOnly,
    });
    
    toast.success('New keypair generated!');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <Key className="w-8 h-8" />
            Solana Keypair Generator
          </h1>
          <p className="text-muted-foreground">
            Generate a new Solana keypair for NFT minting authority
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate NFT Mint Authority</CardTitle>
            <CardDescription>
              Generate a new Solana keypair for NFT minting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateNewKeypair} className="w-full" size="lg">
              <Key className="w-4 h-4 mr-2" />
              Generate New Keypair
            </Button>

            {keypair && (
              <div className="space-y-6 pt-4 border-t">
                {/* Critical Instructions */}
                <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-bold text-destructive text-base">SECRET FIELD STRIPS BRACKETS!</h3>
                      <p className="text-sm">When pasting in Lovable, you MUST manually type the brackets:</p>
                    </div>
                  </div>
                  
                  <div className="bg-background p-4 rounded border-2 border-primary space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase">Step 1: Type opening bracket</p>
                      <div className="p-3 bg-destructive/20 rounded text-center border-2 border-destructive">
                        <code className="text-3xl font-bold">[</code>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase">Step 2: Click "Copy Numbers" below and paste</p>
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => copyToClipboard(keypair.numbersOnly, 'Numbers (without brackets)')}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Numbers Only
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase">Step 3: Type closing bracket</p>
                      <div className="p-3 bg-destructive/20 rounded text-center border-2 border-destructive">
                        <code className="text-3xl font-bold">]</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-primary/10 rounded">
                    <p className="text-xs font-bold">✅ Final result should look like:</p>
                    <code className="text-xs">[{keypair.numbersOnly.substring(0, 30)}...]</code>
                  </div>
                </div>

                {/* Numbers Preview */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Numbers (what you'll paste):</label>
                  <div className="p-3 bg-muted rounded-md font-mono text-xs break-all max-h-24 overflow-y-auto">
                    {keypair.numbersOnly}
                  </div>
                </div>

                {/* Full Secret (for reference) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Full Secret (for reference only):</label>
                  <div className="p-3 bg-muted/50 rounded-md font-mono text-xs break-all max-h-24 overflow-y-auto border">
                    {keypair.secretArray}
                  </div>
                  <p className="text-xs text-muted-foreground">⚠️ Don't copy this - use the 3-step method above</p>
                </div>

                {/* Public Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-secondary">
                      Public Key (fund this address with SOL):
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(keypair.publicKey, 'Public key')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {keypair.publicKey}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💰 Send at least 0.1 SOL to this address from{' '}
                    <a
                      href="https://faucet.carv.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      CARV Faucet
                    </a>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Complete Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Click "Generate New Keypair"</p>
            <p>2. In the secret field, type <code className="bg-background px-1">[</code></p>
            <p>3. Click "Copy Numbers Only" and paste</p>
            <p>4. Type <code className="bg-background px-1">]</code> at the end</p>
            <p>5. Copy the Public Key and fund it with 0.1+ SOL</p>
            <p>6. Test by winning the game!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateKeypair;
