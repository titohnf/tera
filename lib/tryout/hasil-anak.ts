import { createAdminClient } from '@/lib/supabase/server-admin'
import { learnerAnak } from '@/lib/belajar/sesi'
import { infoPaket } from '@/lib/tryout/paket'
import { judulDenganSeri, nomorSeri } from '@/lib/tryout/judul'
import { muatTryOut, tryOutSiswa, type DataTryOut } from '@/lib/reports/tryout-data'
import type { MasukanTryOut } from '@/lib/tryout/riwayat-kemampuan'

/** Percobaan TERBARU seorang anak pada tiap try out yang hasilnya sudah dibuka admin (quizId → percobaan). */
async function percobaanTerbaruLearner(learnerId: string | null): Promise<Map<string, { attemptId: string; dikirim: string }>> {
  const riwayat = learnerId ? await tryOutSiswa(learnerId) : []
  const terbaru = new Map<string, { attemptId: string; dikirim: string }>()
  for (const r of riwayat) if (!terbaru.has(r.quizId)) terbaru.set(r.quizId, { attemptId: r.attemptId, dikirim: r.dikirim })
  return terbaru
}

const percobaanTerbaru = async (studentId: string) => percobaanTerbaruLearner(await learnerAnak(studentId))

function nilaiDari(data: DataTryOut, attemptId: string): number | null {
  const saya = data.percobaan.find((x) => x.id === attemptId)
  if (!saya || saya.skor === null || data.bobotTotal <= 0) return null
  return (saya.skor / data.bobotTotal) * 100
}

/** Skor akhir (0–100) tiap try out yang sudah dikerjakan dan dibuka hasilnya (quizId → nilai). */
export async function muatNilaiAnak(studentId: string): Promise<Record<string, number | null>> {
  const hasil: Record<string, number | null> = {}
  for (const [quizId, p] of await percobaanTerbaru(studentId)) {
    const data = await muatTryOut(quizId)
    if (data) hasil[quizId] = nilaiDari(data, p.attemptId)
  }
  return hasil
}

/** Bahan analisis per topik untuk halaman Laporan Try Out (akun keluarga saja). */
export async function muatMasukanAnak(studentId: string): Promise<MasukanTryOut[]> {
  const masukan: MasukanTryOut[] = []
  const judulSeri = await judulTampilan(createAdminClient())
  for (const [quizId, p] of await percobaanTerbaru(studentId)) {
    const data = await muatTryOut(quizId)
    if (!data || !data.percobaan.some((x) => x.id === p.attemptId)) continue
    masukan.push({
      quizId,
      judul: judulSeri.get(quizId) ?? data.judul,
      jenjang: data.jenjang,
      mapel: data.mapel,
      urut: data.urut,
      dikirim: p.dikirim,
      attemptId: p.attemptId,
      nilai: nilaiDari(data, p.attemptId),
      soal: data.soal,
      skor: data.skor,
      teks: {},
    })
  }
  return masukan
}

/**
 * Menambahkan teks soal, jawaban anak, dan kunci ke masukan yang diberikan. Dipanggil hanya untuk try out
 * satu mapel yang sedang dibuka, dan satu per satu, karena memuat soal jauh lebih berat daripada skornya.
 */
export async function muatTeksMasukan(masukan: MasukanTryOut[]): Promise<MasukanTryOut[]> {
  const hasil: MasukanTryOut[] = []
  for (const m of masukan) {
    const data = await muatTryOut(m.quizId, { denganTeks: true, attemptId: m.attemptId })
    hasil.push(data ? { ...m, teks: data.teks } : m)
  }
  return hasil
}

/** Judul tampilan "Try Out I TKA Matematika" tiap try out terbit (id → judul), menurut urutan seri sejenjang dan semapel. */
async function judulTampilan(admin: ReturnType<typeof createAdminClient>): Promise<Map<string, string>> {
  const { data: semua } = await admin.from('quizzes').select('id, title, settings').eq('kind', 'tryout').eq('status', 'published').order('created_at')
  const daftar = (semua ?? []) as { id: string; title: string; settings: Record<string, unknown> | null }[]
  const seri = nomorSeri(
    daftar.map((q, i) => {
      const info = infoPaket(q.title, q.settings)
      return { id: q.id, jenjang: info.jenjang, mapel: info.mapel, bukaPada: info.bukaPada, dibuat: i }
    }),
  )
  return new Map(daftar.map((q) => [q.id, judulDenganSeri(q.title, seri.get(q.id) ?? 1)]))
}

/** Satu try out beserta soal, jawaban, kunci, dan pembahasan milik seorang learner; null bila belum dikerjakan atau hasilnya belum dibuka. */
export async function muatDetailLearner(learnerId: string | null, quizId: string): Promise<DetailTryOut | null> {
  const p = (await percobaanTerbaruLearner(learnerId)).get(quizId)
  if (!p) return null
  const data = await muatTryOut(quizId, { denganTeks: true, attemptId: p.attemptId })
  if (!data) return null
  // Waktu mulai mengerjakan; lama pengerjaannya = dikirim − mulai.
  const admin = createAdminClient()
  const { data: percobaan } = await admin.from('attempts').select('started_at').eq('id', p.attemptId).maybeSingle()
  const mulai = (percobaan as { started_at: string | null } | null)?.started_at ?? null

  const judul = (await judulTampilan(admin)).get(quizId) ?? data.judul
  return { data: { ...data, judul }, attemptId: p.attemptId, nilai: nilaiDari(data, p.attemptId), dikirim: p.dikirim, mulai }
}

export interface DetailTryOut {
  data: DataTryOut
  attemptId: string
  nilai: number | null
  dikirim: string
  mulai: string | null
}

/** Untuk akun keluarga dan siswa (kode): learner-nya dicari lewat anak. */
export async function muatDetailAnak(studentId: string, quizId: string): Promise<DetailTryOut | null> {
  return muatDetailLearner(await learnerAnak(studentId), quizId)
}

/** Untuk peserta umum: learner-nya dicari lewat kode peserta (yang sudah divalidasi pemanggil). */
export async function muatDetailPesertaKode(kode: string, quizId: string): Promise<DetailTryOut | null> {
  const { data } = await createAdminClient().from('learners').select('id').eq('access_code', kode).maybeSingle()
  return muatDetailLearner((data as { id: string } | null)?.id ?? null, quizId)
}

/** Untuk akun mandiri: learner-nya adalah yang terpaut ke profil akun itu. */
export async function muatDetailAkun(profileId: string, quizId: string): Promise<DetailTryOut | null> {
  const { data } = await createAdminClient().from('learners').select('id').eq('profile_id', profileId).maybeSingle()
  return muatDetailLearner((data as { id: string } | null)?.id ?? null, quizId)
}
