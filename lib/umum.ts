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
  /** Id profil siswa bimbel pemilik kode ini, atau null (peserta luar, atau pelanggan mandiri). */
  studentId: string | null
}

export async function umumContext(): Promise<KonteksUmum> {
  const kode = (await cookies()).get(COOKIE_KODE)?.value
  if (!kode) redirect('/login?tab=kode')
  const supabase = await createClient()
  const { data: nama } = await supabase.rpc('masuk_peserta', { p_kode: kode })
  if (!nama) redirect('/login?tab=kode&galat=1')
  const admin = createAdminClient()
  const { data: baris } = await admin.from('learners').select('profile_id').eq('access_code', kode).maybeSingle()
  const profilId = (baris as { profile_id: string | null } | null)?.profile_id ?? null
  const punyaAkun = !!profilId
  let studentId: string | null = null
  if (profilId) {
    const { data: profil } = await admin.from('profiles').select('role').eq('id', profilId).maybeSingle()
    if ((profil as { role: string } | null)?.role === 'student') studentId = profilId
  }
  return { kode, nama: nama as string, namaPendek: namaPendek({ full_name: nama as string, nickname: null }), punyaAkun, studentId }
}

/**
 * Siswa bimbel yang masuk dengan kode punya sesi akun keluarganya, dan tampilannya adalah beranda
 * siswa (`/siswa/<anak>`), bukan halaman peserta kode. Tetapi Sora mengarahkan orang kembali ke
 * `/umum/...` setelah selesai mengerjakan (ia hanya tahu cookie kode). Fungsi ini menutup celah
 * itu: bila pemilik kode adalah siswa bimbel DAN yang login memang keluarganya, ia dialihkan ke
 * tempat yang setara di tampilan siswa. Tanpa sesi akun, halaman peserta kode tetap dipakai.
 */
export async function alihkanKeTampilanSiswa(studentId: string | null, tujuan: (studentId: string) => string): Promise<void> {
  if (!studentId) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from('family_students').select('student_id').eq('student_id', studentId).limit(1)
  if ((data ?? []).length > 0) redirect(tujuan(studentId))
}
