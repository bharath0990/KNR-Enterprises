import { AdminProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthState {
  user: AdminProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch the admin profile corresponding to a Supabase user ID
 */
export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name || 'Depot Administrator',
        role: data.role || 'admin',
        avatarUrl: data.avatar_url,
        phone: data.phone,
        lastLogin: data.last_login,
        createdAt: data.created_at,
      };
    }

    // Fallback: If admin_profiles table does not exist or user record is not yet inserted,
    // verify the authenticated Supabase user session directly
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user && authData.user.id === userId) {
      const email = authData.user.email?.toLowerCase() || '';
      const authorizedEmails = [
        'anishreddy057@gmail.com',
        'admin@knrenterprises.com',
        'knrenterprises679@gmail.com',
      ];

      const isAuthorized =
        authorizedEmails.includes(email) ||
        email.endsWith('@knrenterprises.com') ||
        email.endsWith('@knrenterprises.in');

      if (isAuthorized) {
        return {
          id: authData.user.id,
          email: authData.user.email || 'admin@knrenterprises.com',
          fullName: (authData.user.user_metadata?.full_name as string) || 'Administrator',
          role: 'super_admin',
          phone: '+91 8886175855',
          createdAt: authData.user.created_at,
        };
      }
    }

    console.warn('Admin profile check failed or user is not an admin:', error?.message);
    return null;
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    return null;
  }
}

/**
 * Sign in administrator via Supabase Auth
 */
export async function signInAdmin(email: string, password: string): Promise<{ user: AdminProfile | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Development fallback when credentials are not configured
    // Returns diagnostic guidance
    return {
      user: null,
      error: 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable authentication.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return {
        user: null,
        error: error?.message || 'Invalid email or password.',
      };
    }

    // Verify user is in admin_profiles (or authorized administrator fallback)
    const profile = await getAdminProfile(data.user.id);
    if (!profile) {
      // User is authenticated in Supabase but not an authorized admin
      await supabase.auth.signOut();
      return {
        user: null,
        error: 'Access denied. Your account is not registered as an authorized administrator in admin_profiles.',
      };
    }

    // Update last_login if admin_profiles table exists
    try {
      await supabase
        .from('admin_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    } catch {
      // ignore if table not created yet
    }

    return { user: profile };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { user: null, error: errorMsg };
  }
}

/**
 * Sign out administrator
 */
export async function signOutAdmin(): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('knr_admin_session_mock');
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase configuration is required for automated password reset emails.',
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/login#reset-password`,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Password reset link sent to your registered email address.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: errorMsg };
  }
}

/**
 * Update authenticated admin password
 */
export async function updateAdminPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase configuration is required to update passwords.',
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Password updated successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: errorMsg };
  }
}

