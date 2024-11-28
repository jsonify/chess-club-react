// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      auth: {
        persistSession: true,
        storageKey: 'chess-club-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// Helper functions remain the same
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
};
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('Missing Supabase environment variables');
// }

// export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
//   auth: {
//     persistSession: true,
//     storageKey: 'chess-club-auth',
//     autoRefreshToken: true,
//     detectSessionInUrl: true
//   }
// });

// // Helper function to check if user is authenticated
// export const isAuthenticated = async () => {
//   try {
//     const { data: { session }, error } = await supabase.auth.getSession();
//     if (error) throw error;
//     return !!session;
//   } catch (error) {
//     console.error('Auth check error:', error);
//     return false;
//   }
// };

// // Helper function to get current session
// export const getCurrentSession = async () => {
//   try {
//     const { data: { session }, error } = await supabase.auth.getSession();
//     if (error) throw error;
//     return session;
//   } catch (error) {
//     console.error('Session error:', error);
//     return null;
//   }
// };
