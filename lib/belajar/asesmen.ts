import { createClient } from '@/lib/supabase/server'
import type { OpsiSoal, SoalLatihan, TipeSoal } from './tipe-soal'

/**
 * Asesmen sesi yang disusun di Sora, dikerjakan dari akun keluarga.
 *
 * Seluruh akses lewat fungsi database bergerbang (migrasi 201), tidak pernah
 * menyentuh `quizzes`, `questions`, atau `attempts` langsung: tabel-tabel itu
 * memuat kunci jawaban, dan akun yang sama dipakai anaknya berlatih. Fungsi
 * `soal_asesmen_anak` tidak mengembalikan kunci maupun pembahasan, dan
 * penilaian terjadi di `kirim_asesmen_anak` lewat `nilai_jawaban()` yang sama
 * dengan Sora.
 */
export interface AsesmenAnak {
  assessmentId: string
  sessionId: string
  judul: string
  jenis: 'asesmen' | 'remedial' | 'tryout'
  jadwal: string
  namaKelas: string | null
  jumlahSoal: number
  bisaDikerjakan: boolean
  alasan: string | null
  /** Attempt yang berjalan atau sudah selesai; null kalau belum pernah dimulai. */
  attemptId: string | null
  selesai: boolean
  /** 0-100, hanya kalau sudah selesai. */
  persen: number | null
}

interface BarisAsesmen {
  assessment_id: string
  session_id: string
  title: string
  kind: string
  scheduled_at: string
  class_name: string | null
  jumlah_soal: number
  bisa_dikerjakan: boolean
  alasan: string | null
  attempt_id: string | null
  selesai: boolean
  persen: number | string | null
}

export async function asesmenAnak(studentId: string): Promise<AsesmenAnak[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('asesmen_anak', { p_student: studentId })
  if (error) {
    console.error('[belajar] gagal membaca asesmen anak:', error)
    return []
  }
  return ((data as BarisAsesmen[] | null) ?? []).map(b => ({
    assessmentId: b.assessment_id,
    sessionId: b.session_id,
    judul: b.title,
    jenis: (['asesmen', 'remedial', 'tryout'].includes(b.kind) ? b.kind : 'asesmen') as AsesmenAnak['jenis'],
    jadwal: b.scheduled_at,
    namaKelas: b.class_name,
    jumlahSoal: b.jumlah_soal,
    bisaDikerjakan: b.bisa_dikerjakan,
    alasan: b.alasan,
    attemptId: b.attempt_id,
    selesai: b.selesai,
    persen: b.persen === null ? null : Number(b.persen),
  }))
}

interface BarisSoal {
  id: string
  tipe: TipeSoal
  prompt: string
  opsi: OpsiSoal
  bobot: number | string
}

/** Soal sebuah attempt yang belum selesai, urut, tanpa kunci. Kosong = bukan haknya / sudah selesai. */
export async function soalAsesmen(attemptId: string): Promise<SoalLatihan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('soal_asesmen_anak', { p_attempt: attemptId })
  if (error) {
    console.error('[belajar] gagal membaca soal asesmen:', error)
    return []
  }
  return ((data as BarisSoal[] | null) ?? []).map(b => ({
    id: b.id,
    tipe: b.tipe,
    prompt: b.prompt,
    opsi: b.opsi,
    bobot: Number(b.bobot) || 1,
  }))
}

/** Jawaban yang sudah tercatat, dikunci id soal — untuk melanjutkan pengerjaan. */
export async function jawabanTersimpan(attemptId: string): Promise<Record<string, unknown>> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('jawaban_asesmen_anak', { p_attempt: attemptId })
  const hasil: Record<string, unknown> = {}
  for (const b of (data as { question_id: string; response: unknown }[] | null) ?? []) {
    hasil[b.question_id] = b.response
  }
  return hasil
}
