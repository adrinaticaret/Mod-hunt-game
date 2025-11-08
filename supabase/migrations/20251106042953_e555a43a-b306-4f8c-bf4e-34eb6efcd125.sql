-- Create storage bucket for NFT images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nft-images',
  'nft-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Allow anyone to read NFT images (they're public)
CREATE POLICY "NFT images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'nft-images');

-- Allow edge functions to upload NFT images
CREATE POLICY "Edge functions can upload NFT images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'nft-images' AND
  auth.role() = 'service_role'
);