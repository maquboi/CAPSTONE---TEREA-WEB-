import { createClient } from '@supabase/supabase-js';

// These automatically pull the keys from your env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);

if (!hasSupabaseEnv) {
	// Avoid app crash during local UI development when env vars are not configured yet.
	console.warn(
		'[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Using placeholder client. Configure env vars to enable backend features.'
	);
}

export const supabase = createClient(
	hasSupabaseEnv ? supabaseUrl : 'https://placeholder.supabase.co',
	hasSupabaseEnv ? supabaseKey : 'public-anon-key-placeholder'
);