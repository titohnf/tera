/**
 * Hapus semua data dari tabel invoices.
 * Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/reset-invoices.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fkieereilqfiqtjmpher.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY env var required')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { count, error } = await sb
  .from('invoices')
  .delete({ count: 'exact' })
  .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

if (error) {
  console.error('Gagal menghapus:', error.message)
  process.exit(1)
}

console.log(`Berhasil menghapus ${count} invoice.`)
