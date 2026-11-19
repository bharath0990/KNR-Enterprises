import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables with production defaults
const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as any)
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://wslxpaxwwmgbhpcandld.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XsaGQKSZ0yMGKQCdmJA7jA_vQ9fLrBj';

// Validate if real Supabase credentials are configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey.length > 20
  );
};

// Fallback dummy URL and anon key for initial runtime before environment variables are supplied
// This ensures createClient does not throw at module load time
const activeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const activeKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key-12345678901234567890';

export const supabase: SupabaseClient = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Diagnostic helper to verify whether the application has an active, reachable connection
 * to the Supabase PostgreSQL backend.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)',
    };
  }

  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Database connection error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to KNR Enterprises Supabase database',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Network/connection error: ${errorMsg}`,
    };
  }
}

