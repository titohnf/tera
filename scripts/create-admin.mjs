import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fkieereilqfiqtjmpher.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWVlcmVpbHFmaXF0am1waGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwNTcwOSwiZXhwIjoyMDkzMzgxNzA5fQ.u1aUyrOgeJu7O4MFHAAy0EMJYg87jIHxBuLbW8dIBZw'

const EMAIL = 'admin@terabimbel.com'
const PASSWORD = 'admin123456'
const FULL_NAME = 'Admin Tera'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const { data, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: FULL_NAME, role: 'admin' },
})

if (error) {
  console.error('Gagal membuat user:', error.message)
  process.exit(1)
}

console.log('✓ Akun admin berhasil dibuat!')
console.log(`  Email    : ${EMAIL}`)
console.log(`  Password : ${PASSWORD}`)
console.log(`  User ID  : ${data.user.id}`)
