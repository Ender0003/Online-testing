import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://lcvclvnmnmxchiyhmezu.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_efKN-EoQmNa0VSQdR5Gg4w_T7p9rBeW'
export const supabase = createClient(supabaseUrl, supabaseKey)
