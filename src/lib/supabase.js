import { createClient } from '@supabase/supabase-js'

import config from '../config.json'

const supabaseUrl = config.supabaseUrl
const supabaseAnonKey = config.supabaseAnonKey

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration in config.json.\n' +
    'Please ensure src/config.json exists with supabaseUrl and supabaseAnonKey.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export default supabase
