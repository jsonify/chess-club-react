import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, ''); // Remove trailing slash if present
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'chess-club-auth'  // Add unique storage key
  }
});

// Log initialization (but safer URL display)
console.log('Supabase client initialized with project:', supabaseUrl.split('https://')[1].split('.')[0]);

// Export project details for debugging
export const SUPABASE_PROJECT = {
  url: supabaseUrl,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey)
};