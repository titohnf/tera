import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { namaPendek } from '@/lib/nama'

/**
 * Peserta umum yang masuk dengan KODE (tanpa akun).
 *
 * Satu orang yang sama dengan pengguna umum berakun: baris `learners`-nya
 * sama, hanya cara masuknya yang berbeda. Kodenya (`learners.access_code`)
 * adalah kredensialnya, jadi cookie cukup menyimpan kode itu (httpOnly) dan
 * setiap permintaan memeriksanya ulang lewat `masuk_peserta()` — tidak ada
 * status sesi lain yang bisa menyimpang. Data dibaca lewat fungsi database
 * berkunci kode, bukan lewat tabel, jadi tidak ada pelonggaran RLS.
 */
export const COOKIE_KODE = 'kode_peserta'

export interface KonteksUmum {
  kode: string
  nama: string
  namaPendek: string
  /**
   * Kode ini milik orang yang SUDAH punya akun Tera (siswa bimbel atau pelanggan): barisnya
   * `learners` terpaut ke profil. Mereka tidak perlu diajak berlangganan atau membuat akun,
   * dan Latihan, Misi, serta Materi dibuka dengan masuk lewat email.
   */
  punyaAkun: boolean
}

export async function umumContext(): Promise<KonteksUmum> {
  const kode = (await cookies()).get(COOKIE_KODE)?.value
  if (!kode) redirect('/login?tab=kode')
  const supabase = await createClient()
  const { data: nama } = await supabase.rpc('masuk_peserta', { p_kode: kode })
  if (!nama) redirect('/login?tab=kode&galat=1')
  const { data: baris } = await createAdminClient().from('learners').select('profile_id').eq('access_code', kode).maybeSingle()
  const punyaAkun = !!(baris as { profile_id: string | null } | null)?.profile_id
  return { kode, nama: nama as string, namaPendek: namaPendek({ full_name: nama as string, nickname: null }), punyaAkun }
}
