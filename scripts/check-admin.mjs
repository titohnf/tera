import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: profiles } = await admin.from('profiles').select('id, full_name, email, role')
console.log('Profiles:', JSON.stringify(profiles, null, 2))
