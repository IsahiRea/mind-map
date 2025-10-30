import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Environment variables are validated at app startup in main.jsx
// so we can safely use them here
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)
