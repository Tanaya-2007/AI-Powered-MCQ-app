import { createClient } from '@supabase/supabase-js';

// Supabase Cloud Project URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgmqttstjfgnyhzywjuz.supabase.co';

// Supabase Anon API Key (used for Auth & Client-side API interactions)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
