import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lcvclvnmnmxchiyhmezu.supabase.co'
const supabaseKey = 'sb_publishable_efKN-EoQmNa0VSQdR5Gg4w_T7p9rBeW'
export const supabase = createClient(supabaseUrl, supabaseKey)