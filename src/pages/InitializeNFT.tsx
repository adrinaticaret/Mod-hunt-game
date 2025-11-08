import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Upload } from 'lucide-react';

export default function InitializeNFT() {
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const uploadTemplate = async () => {
    setIsUploading(true);
    try {
      // Fetch the template image from public folder
      const response = await fetch('/nft-champion.png');
      if (!response.ok) {
        throw new Error('Failed to fetch template image');
      }

      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('nft-images')
        .upload('nft-champion.png', blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        throw error;
      }

      setIsComplete(true);
      toast.success('NFT template uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload template');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">NFT Template Setup</CardTitle>
          <CardDescription>
            Upload the champion trophy template to enable NFT minting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <img 
              src="/nft-champion.png" 
              alt="NFT Champion Trophy" 
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>

          {!isComplete ? (
            <Button 
              onClick={uploadTemplate} 
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-5 w-5 animate-bounce" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Template to Storage
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-500 font-semibold">
              <CheckCircle2 className="h-6 w-6" />
              Template Ready!
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">What this does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Uploads the champion trophy image to Supabase Storage</li>
              <li>Makes it available for NFT minting</li>
              <li>Only needs to be done once</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.location.href = '/'}
          >
            Back to Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
