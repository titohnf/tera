import { createAdminClient } from '@/lib/supabase/server-admin'
import { infoPaket, urutJenjang, urutMapel } from '@/lib/tryout/paket'

/**
 * Rekap skor seluruh peserta try out: satu baris per peserta per jenjang, satu kolom nilai per mata
 * pelajaran. Hanya percobaan yang SUDAH DIKIRIM. Dibaca dengan klien admin; pemanggil (halaman dan
 * unduhan admin) yang memastikan pembacanya admin.
 */
export interface NilaiMapel {
  /** Nilai 0-100. */
  nilai: number | null
  skor: number | null
  bobot: number
  mulai: string
  selesai: string
  durasiMenit: number | null
}

export interface BarisRekap {
  kunci: string
  nama: string
  asal: string
  jenjang: string
  kelas: string | null
  /** Menurut nama mapel. */
  nilai: Record<string, NilaiMapel>
  rata: number | null
}

export interface Rekap {
  mapel: { jenjang: string; nama: string }[]
  jenjang: string[]
  baris: BarisRekap[]
  /** Per paket: jumlah peserta dan rata-rata nilai. */
  paket: { judul: string; jenjang: string; mapel: string; peserta: number; rata: number | null; sedang: number }[]
}

async function semua<T>(ambil: (dari: number, sampai: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const hasil: T[] = []
  for (let dari = 0; ; dari += 1000) {
    const { data } = await ambil(dari, dari + 999)
    const baris = data ?? []
    hasil.push(...baris)
    if (baris.length < 1000) break
  }
  return hasil
}

export async function muatRekap(): Promise<Rekap> {
  const admin = createAdminClient()
  const { data: kuis } = await admin.from('quizzes').select('id, title, settings').eq('kind', 'tryout').eq('status', 'published')
  const paket = ((kuis ?? []) as { id: string; title: string; settings: Record<string, unknown> | null }[]).map((q) => ({
    id: q.id,
    judul: q.title,
    ...infoPaket(q.title, q.settings),
  }))
  const idPaket = paket.map((p) => p.id)
  if (idPaket.length === 0) return { mapel: [], jenjang: [], baris: [], paket: [] }

  const bobot = new Map<string, number>()
  const soal = await semua<{ quiz_id: string; weight: number }>((a, b) =>
    admin.from('questions').select('quiz_id, weight').in('quiz_id', idPaket).order('id').range(a, b),
  )
  for (const s of soal) bobot.set(s.quiz_id, (bobot.get(s.quiz_id) ?? 0) + Number(s.weight ?? 0))

  const percobaan = await semua<{
    id: string
    quiz_id: string
    learner_id: string | null
    guest_name: string | null
    started_at: string
    submitted_at: string
    total_score: number | null
  }>((a, b) =>
    admin
      .from('attempts')
      .select('id, quiz_id, learner_id, guest_name, started_at, submitted_at, total_score')
      .in('quiz_id', idPaket)
      .not('submitted_at', 'is', null)
      .order('submitted_at')
      .range(a, b),
  )

  // Yang sedang mengerjakan: percobaan sudah dimulai tetapi belum dikirim.
  const berjalan = await semua<{ quiz_id: string }>((a, b) =>
    admin.from('attempts').select('quiz_id').in('quiz_id', idPaket).is('submitted_at', null).order('id').range(a, b),
  )
  const sedangPerKuis = new Map<string, number>()
  for (const x of berjalan) sedangPerKuis.set(x.quiz_id, (sedangPerKuis.get(x.quiz_id) ?? 0) + 1)

  const idLearner = [...new Set(percobaan.map((p) => p.learner_id).filter((x): x is string => !!x))]
  const learner = new Map<string, { name: string; sekolah: string | null; profile_id: string | null }>()
  for (let i = 0; i < idLearner.length; i += 200) {
    const { data } = await admin.from('learners').select('id, name, sekolah, profile_id').in('id', idLearner.slice(i, i + 200))
    for (const l of (data ?? []) as { id: string; name: string; sekolah: string | null; profile_id: string | null }[]) learner.set(l.id, l)
  }
  const idProfil = [...new Set([...learner.values()].map((l) => l.profile_id).filter((x): x is string => !!x))]
  const profil = new Map<string, { role: string; grade: string | number | null }>()
  for (let i = 0; i < idProfil.length; i += 200) {
    const { data } = await admin.from('profiles').select('id, role, grade').in('id', idProfil.slice(i, i + 200))
    for (const p of (data ?? []) as { id: string; role: string; grade: string | number | null }[]) profil.set(p.id, p)
  }

  const infoKuis = new Map(paket.map((p) => [p.id, p]))
  const peta = new Map<string, BarisRekap>()
  for (const p of percobaan) {
    const q = infoKuis.get(p.quiz_id)
    if (!q) continue
    const l = p.learner_id ? learner.get(p.learner_id) : undefined
    const pr = l?.profile_id ? profil.get(l.profile_id) : undefined
    const nama = (l?.name ?? p.guest_name ?? '(tanpa nama)').trim()
    const kunci = `${p.learner_id ?? `tamu:${nama.toLowerCase()}`}|${q.jenjang}`
    let b = peta.get(kunci)
    if (!b) {
      const asal = pr
        ? pr.role === 'student'
          ? `Siswa bimbel${pr.grade ? ` · kelas ${pr.grade}` : ''}`
          : 'Akun mandiri'
        : l?.sekolah || (l ? 'Peserta luar' : '—')
      b = { kunci, nama, asal, jenjang: q.jenjang, kelas: q.kelas, nilai: {}, rata: null }
      peta.set(kunci, b)
    }
    const total = bobot.get(p.quiz_id) ?? 0
    const skor = p.total_score === null || p.total_score === undefined ? null : Number(p.total_score)
    const dur = (new Date(p.submitted_at).getTime() - new Date(p.started_at).getTime()) / 60000
    // Bila ada lebih dari satu percobaan terkirim pada paket yang sama, yang terbaru dipakai.
    b.nilai[q.mapel] = {
      nilai: skor !== null && total > 0 ? (skor / total) * 100 : null,
      skor,
      bobot: total,
      mulai: p.started_at,
      selesai: p.submitted_at,
      durasiMenit: Number.isFinite(dur) ? dur : null,
    }
  }
  const baris = [...peta.values()]
  for (const b of baris) {
    const v = Object.values(b.nilai).map((x) => x.nilai).filter((x): x is number => x !== null)
    b.rata = v.length ? v.reduce((a, c) => a + c, 0) / v.length : null
  }

  const mapel = [...new Map(paket.map((p) => [`${p.jenjang}|${p.mapel}`, { jenjang: p.jenjang, nama: p.mapel }])).values()].sort(
    (a, b) => urutJenjang(a.jenjang) - urutJenjang(b.jenjang) || urutMapel(a.nama) - urutMapel(b.nama),
  )
  // Satu baris per (jenjang, mapel): bila ada beberapa paket dengan keduanya sama (mis. sesi susulan), digabung.
  const ringkasPaket = mapel.map((m) => {
    const isi = baris.filter((b) => b.jenjang === m.jenjang && b.nilai[m.nama])
    const v = isi.map((b) => b.nilai[m.nama].nilai).filter((x): x is number => x !== null)
    const judul = paket.filter((p) => p.jenjang === m.jenjang && p.mapel === m.nama).map((p) => p.judul).join(' + ')
    const sedang = paket.filter((p) => p.jenjang === m.jenjang && p.mapel === m.nama).reduce((n, p) => n + (sedangPerKuis.get(p.id) ?? 0), 0)
    return { judul, jenjang: m.jenjang, mapel: m.nama, peserta: isi.length, rata: v.length ? v.reduce((a, c) => a + c, 0) / v.length : null, sedang }
  })
  return { mapel, jenjang: [...new Set(mapel.map((m) => m.jenjang))].sort((a, b) => urutJenjang(a) - urutJenjang(b)), baris, paket: ringkasPaket }
}

export type Urut = 'rata' | 'nama' | string
export function saring(r: Rekap, jenjang: string | null, urut: Urut, naik: boolean): BarisRekap[] {
  let b = jenjang ? r.baris.filter((x) => x.jenjang === jenjang) : [...r.baris]
  const nilaiUrut = (x: BarisRekap): number | string | null =>
    urut === 'nama' ? x.nama.toLowerCase() : urut === 'rata' ? x.rata : (x.nilai[urut]?.nilai ?? null)
  b.sort((a, c) => {
    const p = nilaiUrut(a), q = nilaiUrut(c)
    if (p === null && q === null) return a.nama.localeCompare(c.nama, 'id')
    if (p === null) return 1 // yang belum ada nilai selalu di bawah
    if (q === null) return -1
    const h = typeof p === 'string' ? p.localeCompare(q as string, 'id') : (p as number) - (q as number)
    return naik ? h : -h
  })
  b = b.map((x) => x)
  return b
}
