import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  'https://fkieereilqfiqtjmpher.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWVlcmVpbHFmaXF0am1waGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwNTcwOSwiZXhwIjoyMDkzMzgxNzA5fQ.u1aUyrOgeJu7O4MFHAAy0EMJYg87jIHxBuLbW8dIBZw'
)

const { data: profiles } = await admin.from('profiles').select('id, full_name, email, role')
console.log('Profiles:', JSON.stringify(profiles, null, 2))
