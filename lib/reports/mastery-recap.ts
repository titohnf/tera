import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'
import { bacaKemajuanTopik, rubrikMapel, type KemajuanTopik } from '@/lib/belajar/sesi'
import { labelPenguasaan, type PitaPenguasaan } from '@/lib/belajar/penguasaan'
import { persenDari } from '@/lib/belajar/penilaian'

export type RecapTopic = {
  groupId: string
  subjectId: string
  theme: string | null
  topic: string
}

export type RecapCell = {
  score: number
  maxScore: number
  percent: number
  label: string | null
  answered: number
}

export type RecapStudent = {
  studentId: string
  learnerId: string
  name: string
  /** Per groupId. Topik yang belum pernah disentuh murid ini tidak punya entri. */
  cells: Record<string, RecapCell>
  overall: RecapCell | null
}

export type MasteryRecap = {
  topics: RecapTopic[]
  students: RecapStudent[]
  /** Murid kelas ini yang belum punya baris `learners`, yaitu belum pernah membuka menu Belajar. */
  withoutAccess: string[]
}

/**
 * Penguasaan per topik untuk seluruh murid satu kelas — versi digital dari rekap
 * "Db Nilai" yang dulu dikerjakan manual di spreadsheet.
 *
 * Angkanya dari `practice_topic_progress()` (lewat `kemajuan_latihan_banyak`,
 * migrasi 209) — fungsi yang SAMA dengan yang dibaca orang tua di portal
 * keluarga dan admin di menu Latihan Mandiri. Dulu rekap ini menjumlahkan
 * seluruh `practice_answers` sendiri (tiap pengulangan menambah pembilang dan
 * penyebut), sehingga untuk anak yang sama tutor bisa melihat angka yang
 * berbeda dari admin dan orang tua. Sekarang: jawaban TERAKHIR per soal,
 * dibagi seluruh soal topik (yang belum dikerjakan belum dikuasai).
 *
 * "Keseluruhan" per murid = rata-rata penguasaan topik yang pernah ia kerjakan
 * di tabel ini — definisi yang sama dengan kolom mapel di menu admin.
 *
 * Panggilan RPC memakai sesi tutor (bukan service role): gerbangnya
 * `tutor_teaches_learner()`, jadi hanya murid aktif di kelas tutor itu yang
 * terbaca. Migrasi 209 wajib sudah dijalankan.
 *
 * `subjectId` opsional: tanpa itu, semua mapel yang pernah dilatih ikut terhitung.
 */
export async function getMasteryRecap(
  classId: string,
  subjectId?: string,
): Promise<MasteryRecap> {
  const admin = createAdminClient()

  const { data: enrolled } = await admin
    .from('class_students')
    .select('student_id, profiles(id, full_name)')
    .eq('class_id', classId)
    .eq('is_active', true)

  type EnrolledRow = { student_id: string; profiles: { id: string; full_name: string } | null }
  const roster = ((enrolled ?? []) as unknown as EnrolledRow[])
    .filter(r => r.profiles)
    .map(r => ({ studentId: r.student_id, name: r.profiles!.full_name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (roster.length === 0) return { topics: [], students: [], withoutAccess: [] }

  const { data: learnerRows } = await admin
    .from('learners')
    .select('id, profile_id')
    .in('profile_id', roster.map(r => r.studentId))

  const learnerByStudent = new Map<string, string>()
  for (const l of learnerRows ?? []) {
    if (l.profile_id) learnerByStudent.set(l.profile_id as string, l.id as string)
  }

  const withoutAccess = roster.filter(r => !learnerByStudent.has(r.studentId)).map(r => r.name)
  const learnerIds = [...learnerByStudent.values()]
  if (learnerIds.length === 0) return { topics: [], students: [], withoutAccess }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('kemajuan_latihan_banyak', { p_learner_ids: learnerIds })
  if (error) {
    // Gagal dibaca bukan "kelas ini belum berlatih": biarkan halaman menampilkan
    // galatnya alih-alih matriks kosong yang menyesatkan.
    throw new Error(`kemajuan_latihan_banyak gagal: [${error.code}] ${error.message}`)
  }

  const perLearner = new Map<string, KemajuanTopik[]>()
  for (const r of (data as { learner_id: string; baris: unknown }[] | null) ?? []) {
    perLearner.set(r.learner_id, bacaKemajuanTopik(r.baris))
  }

  // Topik yang disentuh paling sedikit satu murid, dengan penyebut yang diketahui.
  const disentuh = new Set<string>()
  for (const rows of perLearner.values()) {
    for (const k of rows) if (k.answered > 0 && k.max_available > 0) disentuh.add(k.group_id)
  }

  const { data: groups } = disentuh.size
    ? await admin
        .from('curriculum_topic_groups')
        .select('id, subject_id, theme, topic')
        .in('id', [...disentuh])
    : { data: [] as { id: string; subject_id: string; theme: string | null; topic: string }[] }

  const topics: RecapTopic[] = ((groups ?? []) as { id: string; subject_id: string; theme: string | null; topic: string }[])
    .filter(g => !subjectId || g.subject_id === subjectId)
    .map(g => ({ groupId: g.id, subjectId: g.subject_id, theme: g.theme, topic: g.topic }))
    .sort((a, b) => (a.theme ?? '').localeCompare(b.theme ?? '') || a.topic.localeCompare(b.topic))

  // Satu rubrik per mapel, lewat `mastery_rubric_for` — jalur yang sama dengan
  // halaman Latihan Mandiri, supaya nama pitanya tidak bisa berbeda.
  const mapelIds = [...new Set(topics.map(t => t.subjectId))]
  const rubrikMapelMap = new Map<string, PitaPenguasaan[] | null>(
    await Promise.all(mapelIds.map(async id => [id, await rubrikMapel(id)] as [string, PitaPenguasaan[] | null])),
  )
  // Rubrik global untuk kolom "Keseluruhan" lintas mapel.
  const { data: rubrikGlobal } = await admin.from('mastery_rubrics').select('subject_id, bands')
  const pitaGlobal =
    ((rubrikGlobal ?? []) as { subject_id: string | null; bands: PitaPenguasaan[] }[]).find(r => r.subject_id === null)
      ?.bands ?? null
  const subjectByGroup = new Map(topics.map(t => [t.groupId, t.subjectId]))
  const tampil = new Set(topics.map(t => t.groupId))

  const students: RecapStudent[] = roster
    .filter(r => learnerByStudent.has(r.studentId))
    .map(r => {
      const learnerId = learnerByStudent.get(r.studentId)!
      const cells: Record<string, RecapCell> = {}
      let jumlahPersen = 0
      let cacahTopik = 0
      let soal = 0
      let skor = 0
      let maks = 0

      for (const k of perLearner.get(learnerId) ?? []) {
        if (!tampil.has(k.group_id) || k.answered <= 0 || k.max_available <= 0) continue
        const persen = persenDari(k.score, k.max_available)
        const pita = rubrikMapelMap.get(subjectByGroup.get(k.group_id) ?? '') ?? null
        cells[k.group_id] = {
          score: k.score,
          maxScore: k.max_available,
          percent: persen,
          answered: k.answered,
          label: labelPenguasaan(pita, persen),
        }
        jumlahPersen += persen
        cacahTopik += 1
        soal += k.answered
        skor += k.score
        maks += k.max_available
      }

      const rata = cacahTopik > 0 ? Math.round(jumlahPersen / cacahTopik) : null
      const pitaKeseluruhan = subjectId ? (rubrikMapelMap.get(subjectId) ?? null) : pitaGlobal
      return {
        studentId: r.studentId,
        learnerId,
        name: r.name,
        cells,
        overall:
          rata === null
            ? null
            : { score: skor, maxScore: maks, percent: rata, answered: soal, label: labelPenguasaan(pitaKeseluruhan, rata) },
      }
    })

  return { topics, students, withoutAccess }
}
