import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('Faltan REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY en el entorno.');
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Supabase provider ids for the social login buttons
export const OAUTH_PROVIDERS = {
  google: 'google',
  microsoft: 'azure',
  apple: 'apple',
};
