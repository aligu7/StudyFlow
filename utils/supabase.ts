import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export const useSupabase = () => {
  if (!_supabase) {
    // Get environment variables - works in both dev and production
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}
