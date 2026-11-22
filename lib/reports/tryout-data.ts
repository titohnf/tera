import { createAdminClient } from '@/lib/supabase/server-admin'
import { infoPaket, type InfoPaket } from '@/lib/tryout/paket'
import { bersihkanPembahasan } from '@/lib/tryout/bersihkan-pembahasan'
import type { PetaKompetensi, SkorAnalisis, SoalAnalisis } from '@/lib/reports/kompetensi-tryout'
import { skorJawaban } from '@/lib/reports/kompetensi-tryout'

/**
 * Data hasil try out untuk laporan: soal (dengan peta kompetensinya), percobaan
 * yang SUDAH DIKIRIM, dan skor per soal. Dibaca dengan klien admin — pemanggil
 * yang bertanggung jawab memastikan pembacanya berhak (halaman admin lewat
 * layout admin; portal keluarga lewat `anakOrRedirect`).
 *
 * Try out hidup di tabel kuis Sora (`quizzes.kind = 'tryout'`). Satu paket =
 * satu try out. Percobaan terhubung ke siswa Tera lewat `attempts.learner_id`
 * → `learners.profile_id`; percobaan tanpa tautan tetap dihitung di analisis
 * kelas, tetapi tidak muncul di laporan siswa mana pun.
 *
 * Semua pembacaan berhalaman: PostgREST memotong di 1.000 baris, dan 30 soal ×
 * puluhan peserta melewatinya tanpa suara.
 */

export interface RingkasTryOut {
  id: string
  judul: string
  dibuat: string
  /** Percobaan yang sudah dikirim. */
  jumlahSelesai: number
}

export interface PercobaanTryOut {
  id: string
  nama: string
  learnerId: string | null
  studentId: string | null
  dikirim: string
  skor: number | null
}

/** Soal beserta jawaban anak, kunci, dan pembahasannya, untuk halaman orang tua. */
export interface TeksSoal {
  tipe: string
  prompt: string
  opsi: unknown
  kunci: unknown
  pembahasan: string | null
  /** Yang dikirim anak pada percobaan yang dimaksud; null bila dilewati. */
  jawaban: unknown
}

export interface DataTryOut {
  id: string
  judul: string
  /** Target siswa, mapel, durasi, dan jadwal try out ini. */
  info: InfoPaket
  hasilDibuka: boolean
  jenjang: string | null
  mapel: string | null
  /** Pengurut try out dalam satu mata pelajaran: jam buka, atau waktu dibuat bila belum dijadwalkan. */
  urut: string
  bobotTotal: number
  soal: SoalAnalisis[]
  /** Terisi hanya bila `muatTryOut` dipanggil dengan `denganTeks`. Kunci: id soal. */
  teks: Record<string, TeksSoal>
  percobaan: PercobaanTryOut[]
  skor: SkorAnalisis[]
  /** True bila kolom `kompetensi` belum ada (migrasi 224 belum dijalankan). */
  tanpaKolomKompetensi: boolean
}

const HALAMAN = 1000

async function baca<T>(ambil: (dari: number, sampai: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const semua: T[] = []
  for (let dari = 0; ; dari += HALAMAN) {
    const { data, error } = await ambil(dari, dari + HALAMAN - 1)
    if (error) throw new Error(error.message)
    const baris = data ?? []
    semua.push(...baris)
    if (baris.length < HALAMAN) break
  }
  return semua
}

/** Semua try out yang sudah terbit, beserta jumlah percobaan yang sudah dikirim. */
export async function daftarTryOut(): Promise<RingkasTryOut[]> {
  const admin = createAdminClient()
  const { data: kuis } = await admin
    .from('quizzes')
    .select('id, title, created_at')
    .eq('kind', 'tryout')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  const daftar = (kuis ?? []) as { id: string; title: string; created_at: string }[]
  if (daftar.length === 0) return []
  const percobaan = await baca<{ quiz_id: string }>((a, b) =>
    admin.from('attempts').select('quiz_id').in('quiz_id', daftar.map((k) => k.id)).not('submitted_at', 'is', null).order('id').range(a, b),
  )
  const hitung = new Map<string, number>()
  for (const p of percobaan) hitung.set(p.quiz_id, (hitung.get(p.quiz_id) ?? 0) + 1)
  return daftar.map((k) => ({ id: k.id, judul: k.title, dibuat: k.created_at, jumlahSelesai: hitung.get(k.id) ?? 0 }))
}

/** Seluruh data satu try out, atau null bila bukan try out yang terbit. */
export async function muatTryOut(quizId: string, opsi: { denganTeks?: boolean; attemptId?: string } = {}): Promise<DataTryOut | null> {
  const admin = createAdminClient()
  const { data: kuis } = await admin.from('quizzes').select('id, title, kind, created_at, settings').eq('id', quizId).maybeSingle()
  if (!kuis || (kuis as { kind: string }).kind !== 'tryout') return null

  // `kompetensi` ada sejak migrasi 224. Bila belum, soal dibaca tanpanya dan laporan memberi tahu.
  let tanpaKolom = false
  let soalMentah: { id: string; order_index: number; weight: number; kompetensi?: PetaKompetensi | null }[] = []
  {
    const r = await admin.from('questions').select('id, order_index, weight, kompetensi').eq('quiz_id', quizId).order('order_index')
    if (r.error) {
      tanpaKolom = true
      const r2 = await admin.from('questions').select('id, order_index, weight').eq('quiz_id', quizId).order('order_index')
      soalMentah = (r2.data ?? []) as typeof soalMentah
    } else {
      soalMentah = (r.data ?? []) as typeof soalMentah
    }
  }
  const teks: Record<string, TeksSoal> = {}
  if (opsi.denganTeks) {
    const r = await admin.from('questions').select('id, type, prompt, options, correct_answer, explanation').eq('quiz_id', quizId)
    const jawab = new Map<string, unknown>()
    if (opsi.attemptId) {
      const j = await admin.from('answers').select('question_id, response').eq('attempt_id', opsi.attemptId)
      for (const x of (j.data ?? []) as { question_id: string; response: unknown }[]) jawab.set(x.question_id, x.response)
    }
    for (const q of (r.data ?? []) as { id: string; type: string; prompt: string; options: unknown; correct_answer: unknown; explanation: string | null }[]) {
      teks[q.id] = { tipe: q.type, prompt: q.prompt, opsi: q.options, kunci: q.correct_answer, pembahasan: bersihkanPembahasan(q.explanation), jawaban: jawab.get(q.id) ?? null }
    }
  }
  const soal: SoalAnalisis[] = soalMentah.map((s) => ({
    id: s.id,
    nomor: s.order_index + 1,
    bobot: Number(s.weight),
    kompetensi: s.kompetensi ?? null,
  }))

  const percobaanMentah = await baca<{
    id: string
    guest_name: string
    learner_id: string | null
    submitted_at: string
    total_score: number | null
  }>((a, b) =>
    admin
      .from('attempts')
      .select('id, guest_name, learner_id, submitted_at, total_score')
      .eq('quiz_id', quizId)
      .not('submitted_at', 'is', null)
      .order('submitted_at')
      .range(a, b),
  )

  // learner → siswa Tera (profil).
  const learnerIds = [...new Set(percobaanMentah.map((p) => p.learner_id).filter((x): x is string => !!x))]
  const profilPerLearner = new Map<string, string>()
  if (learnerIds.length > 0) {
    const { data: ln } = await admin.from('learners').select('id, profile_id').in('id', learnerIds)
    for (const l of (ln ?? []) as { id: string; profile_id: string | null }[]) if (l.profile_id) profilPerLearner.set(l.id, l.profile_id)
  }

  const skorMentah = await baca<{ attempt_id: string; question_id: string; auto_score: number | null; manual_score: number | null }>((a, b) =>
    admin.from('answers').select('attempt_id, question_id, auto_score, manual_score').eq('quiz_id', quizId).order('id').range(a, b),
  )
  const selesai = new Set(percobaanMentah.map((p) => p.id))
  const skor: SkorAnalisis[] = skorMentah
    .filter((s) => selesai.has(s.attempt_id))
    .map((s) => ({ attemptId: s.attempt_id, questionId: s.question_id, skor: skorJawaban(s.auto_score, s.manual_score) }))

  return {
    id: quizId,
    judul: (kuis as { title: string }).title,
    info: infoPaket((kuis as { title: string }).title, (kuis as { settings: Record<string, unknown> | null }).settings),
    hasilDibuka: (kuis as { settings: { hasil_dibuka?: boolean } | null }).settings?.hasil_dibuka === true,
    jenjang: (kuis as { settings: { jenjang?: string } | null }).settings?.jenjang ?? null,
    mapel: (kuis as { settings: { mapel?: string } | null }).settings?.mapel ?? null,
    urut: (kuis as { settings: { opens_at?: string } | null }).settings?.opens_at ?? (kuis as { created_at: string }).created_at,
    bobotTotal: soal.reduce((n, s) => n + s.bobot, 0),
    soal,
    teks,
    percobaan: percobaanMentah.map((p) => ({
      id: p.id,
      nama: p.guest_name,
      learnerId: p.learner_id,
      studentId: p.learner_id ? (profilPerLearner.get(p.learner_id) ?? null) : null,
      dikirim: p.submitted_at,
      skor: p.total_score,
    })),
    skor,
    tanpaKolomKompetensi: tanpaKolom,
  }
}

/** Try out yang sudah dikerjakan seorang siswa (lewat learner-nya), terbaru dulu. */
export async function tryOutSiswa(learnerId: string): Promise<{ quizId: string; attemptId: string; dikirim: string }[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('attempts')
    .select('id, quiz_id, submitted_at, quizzes!inner(kind, status, settings)')
    .eq('learner_id', learnerId)
    .not('submitted_at', 'is', null)
    .eq('quizzes.kind', 'tryout')
    .order('submitted_at', { ascending: false })
  // Hanya try out yang hasilnya sudah DIBUKA admin (`settings.hasil_dibuka`):
  // keluarga tidak boleh melihat hasil sebelum sesi try out berakhir, sama
  // seperti peserta berkode di halaman Hasil.
  return ((data ?? []) as unknown as { id: string; quiz_id: string; submitted_at: string; quizzes: { settings: { hasil_dibuka?: boolean } | null } }[])
    .filter((r) => r.quizzes?.settings?.hasil_dibuka === true)
    .map((r) => ({
    quizId: r.quiz_id,
    attemptId: r.id,
    dikirim: r.submitted_at,
  }))
}
