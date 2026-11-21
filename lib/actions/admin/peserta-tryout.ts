'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

/**
 * Peserta try out dari luar bimbel: dibuatkan kode, dan ditautkan ke akun
 * siswa saat mereka berlangganan.
 *
 * Mereka disimpan di `learners` (profile_id null) dengan `access_code` sebagai
 * kode masuk di Sora (migrasi 227). Tabel itu hanya terbaca admin, jadi nomor
 * WA dan sekolah aman di sana.
 */

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

// Tanpa 0/O, 1/I/L: kode diketik anak dari pesan WhatsApp.
const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const buatKode = () => Array.from({ length: 6 }, () => ALFABET[Math.floor(Math.random() * ALFABET.length)]).join('')

/** 0812… / +62812… / 62812… → 62812… (untuk tautan wa.me). */
function nomorWa(mentah: string): string | null {
  const angka = mentah.replace(/\D/g, '')
  if (angka.length < 8) return null
  if (angka.startsWith('62')) return angka
  if (angka.startsWith('0')) return '62' + angka.slice(1)
  return '62' + angka
}

export async function tambahPesertaTryOut(formData: FormData): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return
  const nama = String(formData.get('nama') ?? '').trim().replace(/\s+/g, ' ')
  if (!nama) return
  const jenjangMentah = String(formData.get('jenjang') ?? '').trim().toUpperCase()
  const jenjang = ['SD', 'SMP', 'SMA'].includes(jenjangMentah) ? jenjangMentah : null
  const baris = {
    name: nama,
    sekolah: String(formData.get('sekolah') ?? '').trim() || null,
    jenjang,
    nama_wali: String(formData.get('nama_wali') ?? '').trim() || null,
    wa: nomorWa(String(formData.get('wa') ?? '')),
  }

  // Kode bertabrakan jarang sekali (31^6), tetapi indeks unik yang memutuskan.
  for (let percobaan = 0; percobaan < 6; percobaan++) {
    const { error } = await ctx.admin.from('learners').insert({ ...baris, access_code: buatKode() })
    if (!error) break
    if (!error.message.includes('learners_access_code_key')) break
  }
  revalidatePath('/admin/peserta-tryout')
}

export async function tautkanPesertaKeSiswa(formData: FormData): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return
  const learnerId = String(formData.get('learner_id') ?? '')
  const studentId = String(formData.get('student_id') ?? '')
  if (!learnerId || !studentId) return
  await ctx.admin.rpc('tautkan_peserta_ke_siswa', { p_learner: learnerId, p_profile: studentId })
  revalidatePath('/admin/peserta-tryout')
  revalidatePath('/admin/hasil-tryout')
}

/**
 * Membuka atau menutup hasil try out untuk peserta berkode. Hasil di
 * /hasil/<kode> (Sora) baru tampil bila `quizzes.settings.hasil_dibuka` true;
 * dibuka admin setelah semua sesi selesai supaya sesi pertama tidak
 * membocorkan ke sesi berikutnya. Hanya kunci itu yang diubah.
 */
export async function aturHasilDibuka(formData: FormData): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return
  const quizId = String(formData.get('quiz_id') ?? '')
  const buka = String(formData.get('buka') ?? '') === '1'
  if (!quizId) return
  const { data: kuis } = await ctx.admin.from('quizzes').select('settings, kind').eq('id', quizId).maybeSingle()
  if (!kuis || (kuis as { kind: string }).kind !== 'tryout') return
  const settings = ((kuis as { settings: Record<string, unknown> | null }).settings ?? {}) as Record<string, unknown>
  await ctx.admin.from('quizzes').update({ settings: { ...settings, hasil_dibuka: buka } }).eq('id', quizId)
  revalidatePath('/admin/hasil-tryout')
}

/**
 * Jadwal sebuah try out: kapan tombol Mulai bisa dipakai (`opens_at`) dan, bila perlu,
 * kapan ditutup (`closes_at`). Jam diisi dalam WIB. Kosong berarti tanpa batas. Hanya dua
 * kunci itu yang diubah; database yang menahan peserta sebelum jamnya
 * (`mulai_percobaan_peserta` memeriksa `opens_at`).
 */
export async function aturJadwalTryOut(formData: FormData): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return
  const quizId = String(formData.get('quiz_id') ?? '')
  if (!quizId) return
  const keIso = (v: FormDataEntryValue | null): string | null | undefined => {
    const t = String(v ?? '').trim()
    if (!t) return null
    const d = new Date(`${t.length === 16 ? t + ':00' : t}+07:00`)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }
  const buka = keIso(formData.get('opens_at'))
  const tutup = keIso(formData.get('closes_at'))
  if (buka === undefined || tutup === undefined) return
  if (buka && tutup && new Date(tutup) <= new Date(buka)) return
  const { data: kuis } = await ctx.admin.from('quizzes').select('settings, kind').eq('id', quizId).maybeSingle()
  if (!kuis || (kuis as { kind: string }).kind !== 'tryout') return
  const settings = ((kuis as { settings: Record<string, unknown> | null }).settings ?? {}) as Record<string, unknown>
  await ctx.admin.from('quizzes').update({ settings: { ...settings, opens_at: buka, closes_at: tutup } }).eq('id', quizId)
  revalidatePath('/admin/jadwal-tryout')
  revalidatePath('/umum/tryout')
  revalidatePath('/mandiri/tryout')
}
