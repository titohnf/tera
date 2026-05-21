import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  'https://fkieereilqfiqtjmpher.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWVlcmVpbHFmaXF0am1waGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwNTcwOSwiZXhwIjoyMDkzMzgxNzA5fQ.u1aUyrOgeJu7O4MFHAAy0EMJYg87jIHxBuLbW8dIBZw'
)

const { error } = await admin
  .from('profiles')
  .update({ role: 'admin' })
  .eq('email', 'admin@terabimbel.com')

if (error) {
  console.error('Gagal update role:', error.message)
} else {
  console.log('✓ Role admin@terabimbel.com berhasil diubah ke admin')
}
