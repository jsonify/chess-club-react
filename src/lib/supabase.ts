import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Check for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // In development, show detailed error
  if (import.meta.env.DEV) {
    console.error('Missing Supabase environment variables:', {
      url: supabaseUrl ? '✓' : '✗',
      key: supabaseAnonKey ? '✓' : '✗'
    });
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    );
  } else {
    // In production, show user-friendly error
    toast.error('Unable to connect to database. Please contact support.');
    console.error('Missing Supabase configuration');
  }
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',  // Provide fallback to prevent TS errors
  supabaseAnonKey || '', 
  {
    auth: {
      persistSession: true,
      storageKey: 'chess-club-auth'
    }
  }
);

// Export project details for debugging
export const SUPABASE_PROJECT = {
  url: supabaseUrl?.replace(/\/$/, ''), // Remove trailing slash if present
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey)
};

// Add connection status check
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('students').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};