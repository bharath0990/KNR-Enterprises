import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Uploads an image file to Supabase Storage.
 * If Supabase is not configured or in local development mode, falls back to a base64 Data URL
 * so administrators can preview and save images without blocking their workflow.
 */
export async function uploadProductImage(
  file: File,
  folder: string = 'catalog'
): Promise<UploadResult> {
  // Fallback if Supabase is not yet configured
  if (!isSupabaseConfigured()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result as string,
          path: `local/${file.name}`,
        });
      };
      reader.onerror = () => {
        resolve({
          url: URL.createObjectURL(file),
          path: `local/${file.name}`,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const uniquePath = `${folder}/${Date.now()}_${cleanFileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('knr-products')
      .upload(uniquePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      return {
        url: '',
        path: '',
        error: uploadError.message,
      };
    }

    const { data } = supabase.storage
      .from('knr-products')
      .getPublicUrl(uniquePath);

    return {
      url: data.publicUrl,
      path: uniquePath,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Storage upload exception:', errorMsg);
    return {
      url: '',
      path: '',
      error: errorMsg,
    };
  }
}

/**
 * Deletes an image from Supabase Storage by its relative path
 */
export async function deleteProductImage(path: string): Promise<boolean> {
  if (!isSupabaseConfigured() || path.startsWith('local/')) {
    return true;
  }

  try {
    const { error } = await supabase.storage
      .from('knr-products')
      .remove([path]);
    return !error;
  } catch {
    return false;
  }
}

