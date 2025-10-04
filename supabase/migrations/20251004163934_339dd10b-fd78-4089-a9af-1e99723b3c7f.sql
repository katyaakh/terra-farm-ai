-- Storage policies for images bucket

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Public images are viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy: Authenticated users can upload images to their own folder
CREATE POLICY "Users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);