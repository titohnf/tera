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
  /** Jam kirim; null bila percobaan masih berjalan. */
  selesai: string | null
  durasiMenit: number | null
  /** Percobaan belum dikirim: nilainya dihitung dari jawaban yang sudah tersimpan, dan masih bisa berubah. */
  sementara: boolean
  terjawab: number
  soalTotal: number
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
  const soalHitung = new Map<string, number>()
  for (const s of soal) {
    bobot.set(s.quiz_id, (bobot.get(s.quiz_id) ?? 0) + Number(s.weight ?? 0))
    soalHitung.set(s.quiz_id, (soalHitung.get(s.quiz_id) ?? 0) + 1)
  }

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

  // Percobaan yang SEDANG berjalan (belum dikirim) ikut ditampilkan dengan nilai sementara: jawaban yang
  // sudah tersimpan dinilai dengan fungsi database yang sama dengan saat kirim (`nilai_jawaban_banyak`),
  // jadi angkanya persis yang akan didapat bila anak berhenti sekarang. Soal yang belum dijawab bernilai 0.
  const berjalan = await semua<{
    id: string
    quiz_id: string
    learner_id: string | null
    guest_name: string | null
    started_at: string
  }>((a, b) =>
    admin
      .from('attempts')
      .select('id, quiz_id, learner_id, guest_name, started_at')
      .in('quiz_id', idPaket)
      .is('submitted_at', null)
      .order('id')
      .range(a, b),
  )
  const sedangPerKuis = new Map<string, number>()
  for (const x of berjalan) sedangPerKuis.set(x.quiz_id, (sedangPerKuis.get(x.quiz_id) ?? 0) + 1)

  const skorSementara = new Map<string, { skor: number | null; terjawab: number; soalTotal: number }>()
  if (berjalan.length > 0) {
    const kuisBerjalan = [...new Set(berjalan.map((x) => x.quiz_id))]
    const soalLengkap = await semua<{ id: string; quiz_id: string; type: string; options: unknown; correct_answer: unknown; weight: number; order_index: number }>(
      (a, b) =>
        admin
          .from('questions')
          .select('id, quiz_id, type, options, correct_answer, weight, order_index')
          .in('quiz_id', kuisBerjalan)
          .order('order_index')
          .order('id')
          .range(a, b),
    )
    const soalPerKuis = new Map<string, typeof soalLengkap>()
    for (const q of soalLengkap) soalPerKuis.set(q.quiz_id, [...(soalPerKuis.get(q.quiz_id) ?? []), q])

    const jawaban = new Map<string, unknown>() // `${attempt}|${question}` -> response
    for (let i = 0; i < berjalan.length; i += 100) {
      const ids = berjalan.slice(i, i + 100).map((x) => x.id)
      const dat = await semua<{ attempt_id: string; question_id: string; response: unknown }>((a, b) =>
        admin.from('answers').select('attempt_id, question_id, response').in('attempt_id', ids).order('question_id').range(a, b),
      )
      for (const j of dat) jawaban.set(`${j.attempt_id}|${j.question_id}`, j.response)
    }

    // Satu panggilan untuk semua percobaan: daftar disambung, lalu hasilnya dipotong per percobaan.
    const daftar: unknown[] = []
    const potong: { id: string; dari: number; jumlah: number; terjawab: number }[] = []
    for (const x of berjalan) {
      const soal = soalPerKuis.get(x.quiz_id) ?? []
      let terjawab = 0
      potong.push({ id: x.id, dari: daftar.length, jumlah: soal.length, terjawab: 0 })
      for (const q of soal) {
        const r = jawaban.get(`${x.id}|${q.id}`)
        if (r !== undefined && r !== null) terjawab++
        daftar.push({ tipe: q.type, opsi: q.options, kunci: q.correct_answer, jawaban: r ?? null, bobot: q.weight })
      }
      potong[potong.length - 1].terjawab = terjawab
    }
    const { data: nilai } = await admin.rpc('nilai_jawaban_banyak', { p_daftar: daftar })
    const larik = Array.isArray(nilai) ? (nilai as (number | string | null)[]) : null
    for (const t of potong) {
      let jumlah: number | null = larik ? 0 : null
      if (larik) for (let k = t.dari; k < t.dari + t.jumlah; k++) jumlah = (jumlah ?? 0) + (Number(larik[k]) || 0)
      skorSementara.set(t.id, { skor: jumlah, terjawab: t.terjawab, soalTotal: t.jumlah })
    }
  }

  const idLearner = [...new Set([...percobaan, ...berjalan].map((p) => p.learner_id).filter((x): x is string => !!x))]
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
  const tambah = (
    p: { quiz_id: string; learner_id: string | null; guest_name: string | null; started_at: string },
    isi: { skor: number | null; selesai: string | null; sementara: boolean; terjawab: number; soalTotal: number },
  ) => {
    const q = infoKuis.get(p.quiz_id)
    if (!q) return
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
    const akhir = isi.selesai ?? new Date().toISOString()
    const dur = (new Date(akhir).getTime() - new Date(p.started_at).getTime()) / 60000
    // Percobaan yang sudah dikirim selalu menimpa yang masih berjalan pada paket yang sama.
    if (isi.sementara && b.nilai[q.mapel] && !b.nilai[q.mapel].sementara) return
    b.nilai[q.mapel] = {
      nilai: isi.skor !== null && total > 0 ? (isi.skor / total) * 100 : null,
      skor: isi.skor,
      bobot: total,
      mulai: p.started_at,
      selesai: isi.selesai,
      durasiMenit: Number.isFinite(dur) ? dur : null,
      sementara: isi.sementara,
      terjawab: isi.terjawab,
      soalTotal: isi.soalTotal,
    }
  }
  for (const p of berjalan) {
    const x = skorSementara.get(p.id)
    tambah(p, { skor: x?.skor ?? null, selesai: null, sementara: true, terjawab: x?.terjawab ?? 0, soalTotal: x?.soalTotal ?? 0 })
  }
  for (const p of percobaan) {
    const skor = p.total_score === null || p.total_score === undefined ? null : Number(p.total_score)
    tambah(p, { skor, selesai: p.submitted_at, sementara: false, terjawab: bobot.has(p.quiz_id) ? (soalHitung.get(p.quiz_id) ?? 0) : 0, soalTotal: soalHitung.get(p.quiz_id) ?? 0 })
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
