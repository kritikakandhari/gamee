import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file (then restart npm run dev).')
}

if (supabaseUrl.includes('YOUR_PROJECT_ID') || supabaseUrl.includes('your_project_id')) {
  throw new Error('Supabase URL is still a placeholder. Replace VITE_SUPABASE_URL with the real Project URL from Supabase Dashboard → Project Settings → API (then restart npm run dev).')
}

if (!/^https:\/\/.+\.supabase\.co\/?$/.test(supabaseUrl)) {
  throw new Error('Supabase URL looks invalid. It should look like https://xxxxx.supabase.co (copy it from Supabase Dashboard → Project Settings → API).')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
