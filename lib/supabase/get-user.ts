import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Deduplicated per request — layout and page share one getUser() call
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Versi ringan `getUser()` untuk jalur panas portal keluarga dan /belajar: id dan email dari
 * klaim token yang tanda tangannya diperiksa LOKAL (kunci ES256 + JWKS ter-cache), tanpa satu
 * perjalanan ke layanan auth di setiap render. Dipakai di tempat yang hanya butuh "siapa ini";
 * hak aksesnya tetap diputuskan RLS dan pemeriksaan peran sesudahnya. Yang butuh objek
 * pengguna lengkap atau pengecekan sesi dicabut tetap memakai `getUser()`.
 */
export const getUserCepat = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const c = data?.claims
  return c?.sub ? { id: c.sub, email: typeof c.email === 'string' ? c.email : undefined } : null
})
