import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
