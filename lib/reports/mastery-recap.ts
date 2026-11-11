import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'
import { bacaKemajuanTopik, rubrikMapel, type KemajuanTopik } from '@/lib/belajar/sesi'
import { labelPenguasaan, type PitaPenguasaan } from '@/lib/belajar/penguasaan'
import { persenDari } from '@/lib/belajar/penilaian'

export type MasteryBand = { label: string; min: number }

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
 * Label rubrik untuk sebuah persentase: band tertinggi yang ambangnya tercapai.
 * Null berarti mapel itu tidak punya rubrik, dan pemanggil menampilkan persentase
 * mentah. Tidak ada label yang hardcoded di sini — semuanya dari `mastery_rubrics`.
 */
export function masteryLabel(rubric: MasteryBand[] | null, percent: number): string | null {
  if (!rubric || rubric.length === 0) return null
  const sorted = [...rubric].sort((a, b) => a.min - b.min)
  const reached = sorted.filter(band => percent >= band.min)
  return reached.length > 0 ? reached[reached.length - 1].label : sorted[0].label
}

function cell(score: number, maxScore: number, answered: number, rubric: MasteryBand[] | null): RecapCell {
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return { score, maxScore, percent, answered, label: masteryLabel(rubric, percent) }
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
 * terbaca. Kalau RPC-nya belum ada (migrasi 209 belum dijalankan), jatuh ke
 * hitungan lama di bawah.
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
    console.error('[rekap] kemajuan_latihan_banyak gagal, memakai hitungan lama:', error)
    return getMasteryRecapLama(classId, subjectId)
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

/**
 * HITUNGAN LAMA, hanya cadangan selama migrasi 209 belum dijalankan.
 *
 * Menjumlahkan seluruh `practice_answers` sendiri, jadi angkanya tidak sama
 * dengan yang dibaca admin dan orang tua. HAPUS fungsi ini (dan impor
 * `masteryLabel`/`cell` yang hanya ia pakai) begitu 209 terpasang di produksi.
 */
async function getMasteryRecapLama(
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

  const { data: answers } = await admin
    .from('practice_answers')
    .select('learner_id, question_bank_item_id, score, max_score')
    .in('learner_id', learnerIds)

  const answerRows = (answers ?? []) as {
    learner_id: string
    question_bank_item_id: string
    score: number | null
    max_score: number | null
  }[]

  if (answerRows.length === 0) {
    return {
      topics: [],
      students: roster.map(r => ({
        studentId: r.studentId,
        learnerId: learnerByStudent.get(r.studentId)!,
        name: r.name,
        cells: {},
        overall: null,
      })),
      withoutAccess,
    }
  }

  const itemIds = [...new Set(answerRows.map(a => a.question_bank_item_id))]

  const { data: tags } = await admin
    .from('question_curriculum_tags')
    .select('question_bank_item_id, group_id')
    .in('question_bank_item_id', itemIds)

  const groupIds = [...new Set((tags ?? []).map(t => t.group_id as string))]

  const { data: groups } = await admin
    .from('curriculum_topic_groups')
    .select('id, subject_id, theme, topic, grade_level, semester')
    .in('id', groupIds)

  const topics: RecapTopic[] = (groups ?? [])
    .filter(g => !subjectId || g.subject_id === subjectId)
    .map(g => ({
      groupId: g.id as string,
      subjectId: g.subject_id as string,
      theme: g.theme as string | null,
      topic: g.topic as string,
    }))
    .sort(
      (a, b) => (a.theme ?? '').localeCompare(b.theme ?? '') || a.topic.localeCompare(b.topic),
    )

  const visibleGroups = new Set(topics.map(t => t.groupId))

  // Satu soal bisa ditandai lebih dari satu topik; skornya dihitung di keduanya,
  // karena pertanyaannya "sejauh apa murid menguasai topik ini", bukan "apakah
  // totalnya berjumlah 100%".
  const groupsByItem = new Map<string, string[]>()
  for (const tag of tags ?? []) {
    const item = tag.question_bank_item_id as string
    const group = tag.group_id as string
    if (!visibleGroups.has(group)) continue
    groupsByItem.set(item, [...(groupsByItem.get(item) ?? []), group])
  }

  const { data: rubricRows } = await admin.from('mastery_rubrics').select('subject_id, bands')
  const rubricBySubject = new Map<string | null, MasteryBand[]>()
  for (const row of rubricRows ?? []) {
    rubricBySubject.set(row.subject_id as string | null, row.bands as MasteryBand[])
  }
  const rubricFor = (subject: string | null) =>
    rubricBySubject.get(subject) ?? rubricBySubject.get(null) ?? null

  const subjectByGroup = new Map(topics.map(t => [t.groupId, t.subjectId]))

  type Tally = { score: number; max: number; answered: number }
  const tallies = new Map<string, Tally>() // `${learnerId}|${groupId}`
  const overalls = new Map<string, Tally>()

  for (const answer of answerRows) {
    const groups = groupsByItem.get(answer.question_bank_item_id)
    if (!groups || groups.length === 0) continue

    const score = Number(answer.score ?? 0)
    const max = Number(answer.max_score ?? 0)

    for (const group of groups) {
      const key = `${answer.learner_id}|${group}`
      const current = tallies.get(key) ?? { score: 0, max: 0, answered: 0 }
      tallies.set(key, {
        score: current.score + score,
        max: current.max + max,
        answered: current.answered + 1,
      })
    }

    // Total per murid dihitung sekali per jawaban, bukan sekali per tag, supaya
    // soal bertag ganda tidak menggandakan bobotnya di angka keseluruhan.
    const overall = overalls.get(answer.learner_id) ?? { score: 0, max: 0, answered: 0 }
    overalls.set(answer.learner_id, {
      score: overall.score + score,
      max: overall.max + max,
      answered: overall.answered + 1,
    })
  }

  const students: RecapStudent[] = roster
    .filter(r => learnerByStudent.has(r.studentId))
    .map(r => {
      const learnerId = learnerByStudent.get(r.studentId)!
      const cells: Record<string, RecapCell> = {}

      for (const topic of topics) {
        const tally = tallies.get(`${learnerId}|${topic.groupId}`)
        if (!tally) continue
        cells[topic.groupId] = cell(
          tally.score,
          tally.max,
          tally.answered,
          rubricFor(subjectByGroup.get(topic.groupId) ?? null),
        )
      }

      const overall = overalls.get(learnerId)
      return {
        studentId: r.studentId,
        learnerId,
        name: r.name,
        cells,
        overall: overall
          ? cell(overall.score, overall.max, overall.answered, rubricFor(subjectId ?? null))
          : null,
      }
    })

  // Topik yang tidak seorang pun pernah sentuh hanya jadi kolom kosong.
  const touched = new Set([...tallies.keys()].map(k => k.split('|')[1]))
  return { topics: topics.filter(t => touched.has(t.groupId)), students, withoutAccess }
}
