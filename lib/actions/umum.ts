'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { COOKIE_KODE } from '@/lib/umum'

/** Masuk dengan kode peserta: kode benar -> cookie httpOnly 30 hari, lalu ke beranda umum. */
export async function masukDenganKode(formData: FormData): Promise<void> {
  const kode = String(formData.get('kode') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (!kode) redirect('/login?tab=umum&galat=1')
  const supabase = await createClient()
  const { data: nama } = await supabase.rpc('masuk_peserta', { p_kode: kode })
  if (!nama) redirect('/login?tab=umum&galat=1')
  ;(await cookies()).set(COOKIE_KODE, kode, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/umum')
}

export async function keluarUmum(): Promise<void> {
  ;(await cookies()).delete(COOKIE_KODE)
  redirect('/login?tab=umum')
}

/**
 * Menambahkan email dan password pada peserta umum yang masuk dengan kode.
 *
 * Orangnya sama: baris `learners` yang sudah punya kode ditautkan ke akun baru
 * (`tautkan_peserta_ke_siswa`, migrasi 228), jadi seluruh riwayat try out ikut
 * dan kodenya tetap berlaku. Akun dibuat lewat API admin (peran `mandiri`, email
 * langsung terverifikasi) — pendaftaran mandiri di dasbor Supabase tidak perlu
 * dibuka. Yang berhak adalah pemegang kode: cookie `kode_peserta` diperiksa
 * ulang di sini, bukan dipercaya dari formulir.
 */
export async function buatAkunDariKode(formData: FormData): Promise<void> {
  const kode = (await cookies()).get(COOKIE_KODE)?.value
  if (!kode) redirect('/login?tab=umum')

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const ulang = String(formData.get('ulang') ?? '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect('/umum/akun?galat=email')
  if (password.length < 8) redirect('/umum/akun?galat=pendek')
  if (password !== ulang) redirect('/umum/akun?galat=beda')

  const admin = createAdminClient()
  const { data: learner } = await admin.from('learners').select('id, name, profile_id').eq('access_code', kode).maybeSingle()
  if (!learner) redirect('/login?tab=umum&galat=1')
  if ((learner as { profile_id: string | null }).profile_id) redirect('/umum/akun?galat=sudah')

  const { data: baru, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: (learner as { name: string }).name, role: 'mandiri' },
  })
  if (error || !baru.user) redirect('/umum/akun?galat=terpakai')

  const { error: galatTaut } = await admin.rpc('tautkan_peserta_ke_siswa', {
    p_learner: (learner as { id: string }).id,
    p_profile: baru.user.id,
  })
  if (galatTaut) {
    // Jangan tinggalkan akun yatim yang menghalangi email ini dipakai lagi.
    await admin.auth.admin.deleteUser(baru.user.id)
    redirect('/umum/akun?galat=gagal')
  }

  ;(await cookies()).delete(COOKIE_KODE)
  redirect('/login?info=akun')
}
