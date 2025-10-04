import { supabase } from "@/integrations/supabase/client";

export interface UploadImageResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 * Images are stored in the 'images' bucket under userId/filename
 */
export const uploadImage = async (
  file: File,
  userId: string
): Promise<UploadImageResult> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Delete an image from Supabase Storage
 */
export const deleteImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
};

/**
 * Get public URL for an image
 */
export const getImageUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path);
  
  return data.publicUrl;
};