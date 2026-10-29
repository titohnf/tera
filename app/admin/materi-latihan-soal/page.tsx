import { createAdminClient } from '@/lib/supabase/server-admin'
import { createCurriculumResource, deleteCurriculumResource } from '@/lib/actions/admin/curriculum-resources'
import { extractDriveFileId } from '@/lib/curriculum-resource-links'
import MateriLatihanSoalClient from '@/components/admin/materi-latihan-soal/MateriLatihanSoalClient'
import { nomorKurikulum, formatNomor } from '@/lib/curriculum-numbering'
import StatusMateriPanel from '@/components/admin/materi-latihan-soal/StatusMateriPanel'
import SinkronSoalPanel, { type RingkasanSoal } from '@/components/admin/materi-latihan-soal/SinkronSoalPanel'

// Tombol "Sinkronkan dengan Drive sekarang" membaca folder Drive dan memeriksa ratusan
// berkas; aksinya mewarisi batas waktu halaman ini.
export const maxDuration = 300

type TutorRef = { full_name: string; nickname: string | null } | null

// Prefer the tutor's nickname; fall back to just their first name (not the
// full name) to keep the Tutor column compact.
function shortTutorName(tutor: TutorRef): string | null {
  if (!tutor) return null
  if (tutor.nickname?.trim()) return tutor.nickname.trim()
  return tutor.full_name.trim().split(/\s+/)[0] ?? null
}

type MaterialSourceRow = {
  id: string
  title: string
  link_url: string | null
  file_path?: string | null
  // Hanya terisi pada baris `assessments`: penanda bahwa paketnya lahir di
  // Sora, bukan diketik manual di Tera. Lihat migrasi 071/074 — asesmen buatan
  // Tera tidak pernah punya `quiz_id`.
  quiz_id?: string | null
  session_id: string
  created_at: string
  sessions: {
    class_id: string
    subject_id: string | null
    curriculum_topic_id: string | null
    custom_theme: string | null
    topic: string | null
    selected_cp_ids: string[] | null
    tutor: TutorRef
  } | null
}

// Latihan soal is captured per TOPIC on the session itself (sessions.cp_urls, a
// {topicGroupId: url} map since migration 080 — see
// components/admin/sessions/LatihanSoalTab.tsx), not in the `assessments` table. `assessments` is the separate "Asesmen" grading
// feature (max_score/due_at/results) and gets its own column instead.
type SessionCpUrlRow = {
  id: string
  class_id: string
  subject_id: string | null
  custom_theme: string | null
  topic: string | null
  selected_cp_ids: string[] | null
  cp_urls: Record<string, string> | null
  custom_learning_outcomes: string[] | null
  tutor: TutorRef
}

export type TutorResourceRow = {
  id: string
  kind: 'lampiran' | 'latihan_soal' | 'asesmen' | 'bank_soal'
  /**
   * Siapa yang menaruhnya. `sora` berarti barisnya tidak hidup di tabel mana
   * pun di halaman ini — ia cerminan isi Sora, jadi ia tidak bisa dihapus dari
   * sini. Baris tanpa nilai ini datang dari tutor, seperti sebelumnya.
   */
  source?: 'tutor' | 'sora'
  title: string
  href: string
  sessionId: string
  subjectId: string
  curriculumTopicId: string | null
  customTheme: string | null
  topicText: string | null
  tutorName: string | null
  /**
   * CP yang dipilih sesi tempat item ini ditempelkan (`sessions.selected_cp_ids`).
   * Tabel menampilkan labelnya, disaring ke CP milik topik barisnya.
   */
  cpIds?: string[]
  /** Hanya pada baris `bank_soal`: asal paketnya (nama form Drive), untuk tooltip. */
  namaSumber?: string
  /** Hanya pada baris `bank_soal`: bahan kolom kelengkapan. */
  jumlahSoal?: number
  jumlahPembahasan?: number
  /** Sudah bisa dikerjakan anak di /belajar: ada butir aktif yang berasal dari sumber ini. */
  terjangkau?: boolean
  // Best-effort Kelas/Semester for entries with no formal curriculum link —
  // derived from the session's class (its own `semester` column, and the
  // mode grade of its enrolled students) so the columns aren't just "—".
  classGradeLevel: string | null
  classSemester: number | null
}

/** Id terbit sebuah Google Form: `/forms/d/e/<id>/viewform`. */
const idTerbit = (u: string | null | undefined): string | null => /\/forms\/d\/e\/([\w-]+)/.exec(u ?? '')?.[1] ?? null

function toTutorResources(
  rows: MaterialSourceRow[],
  kind: 'lampiran' | 'asesmen',
  classInfoById: Map<string, { gradeLevel: string | null; semester: number | null }>,
  soraUrl: string | null,
): TutorResourceRow[] {
  return rows
    .filter(r => r.sessions?.subject_id)
    .map(r => {
      const classInfo = classInfoById.get(r.sessions!.class_id)
      return {
        id: r.id,
        kind,
        title: r.title,
        // Urutannya: tautan Drive yang diketik tutor, lalu paketnya di Sora
        // kalau asesmen ini memang lahir di sana, baru halaman sesinya. Sebelum
        // ini asesmen Sora selalu jatuh ke pilihan terakhir — barisnya muncul
        // tapi menuju tempat yang bukan paketnya, dan satu-satunya cara membuka
        // paket itu adalah mencarinya sendiri di Sora.
        href:
          r.link_url ??
          (r.quiz_id && soraUrl ? `${soraUrl}/dashboard/quizzes/${r.quiz_id}/edit` : null) ??
          `/admin/sessions/${r.session_id}`,
        sessionId: r.session_id,
        subjectId: r.sessions!.subject_id!,
        curriculumTopicId: r.sessions!.curriculum_topic_id,
        customTheme: r.sessions!.custom_theme,
        topicText: r.sessions!.topic,
        tutorName: shortTutorName(r.sessions!.tutor),
        cpIds: r.sessions!.selected_cp_ids ?? [],
        classGradeLevel: classInfo?.gradeLevel ?? null,
        classSemester: classInfo?.semester ?? null,
      }
    })
}

function toLatihanSoalResources(
  sessionRows: SessionCpUrlRow[],
  // Kuncinya id topik (migrasi 080), jadi yang dibutuhkan di sini adalah nama
  // topik plus satu CP wakil — kolom Kurikulum/Kelas/Semester di tabel masih
  // ditelusuri lewat `curriculum_topics`, dan semua CP satu topik memberi
  // jawaban yang sama untuk kolom-kolom itu.
  topicByGroupId: Map<string, { topic: string; representativeCpId: string }>,
  classInfoById: Map<string, { gradeLevel: string | null; semester: number | null }>,
): TutorResourceRow[] {
  const out: TutorResourceRow[] = []
  for (const s of sessionRows) {
    if (!s.subject_id || !s.cp_urls) continue
    const classInfo = classInfoById.get(s.class_id)
    for (const [topicKey, url] of Object.entries(s.cp_urls)) {
      if (!url?.trim()) continue
      // `custom` (dan `custom-N` dari data sebelum migrasi 080) = topik bebas
      // milik kelas privat, tidak punya baris kurikulum.
      const isCustom = topicKey.startsWith('custom')
      const group = topicByGroupId.get(topicKey)
      const title = isCustom ? s.topic ?? 'Latihan Soal' : group?.topic ?? 'Latihan Soal'
      out.push({
        id: `${s.id}__${topicKey}`,
        kind: 'latihan_soal',
        title,
        href: url,
        sessionId: s.id,
        subjectId: s.subject_id,
        curriculumTopicId: isCustom ? null : (group?.representativeCpId ?? null),
        customTheme: isCustom ? s.custom_theme : null,
        topicText: isCustom ? s.topic : null,
        tutorName: shortTutorName(s.tutor),
        cpIds: s.selected_cp_ids ?? [],
        classGradeLevel: classInfo?.gradeLevel ?? null,
        classSemester: classInfo?.semester ?? null,
      })
    }
  }
  return out
}

/**
 * Bank Soal Sora sebagai baris katalog: satu baris per topik yang punya soal.
 *
 * Halaman ini sebelumnya buta terhadap Sora — sumbernya cuma `materials`,
 * `assessments`, dan `sessions.cp_urls`, yang semuanya tautan Drive buatan
 * tutor. Akibatnya sebuah topik terbaca "belum ada latihan soalnya" padahal
 * di Sora sudah ada belasan butir soal bertanda topik itu. Katalog yang diam
 * soal isi yang sebenarnya ada lebih menyesatkan daripada katalog yang kosong.
 *
 * Tidak perlu memutar lewat sesi seperti baris lain: `question_curriculum_tags`
 * menandai soal langsung ke `curriculum_topic_groups`, ruang kunci yang sama
 * dengan `topicByGroupId` di halaman ini.
 *
 * Tanpa `NEXT_PUBLIC_SORA_URL` barisnya tidak dibuat sama sekali. Isi baris ini
 * cuma jumlah dan tautannya; tanpa tautan yang bisa dibuka, ia jadi angka yang
 * menggantung — beda dengan kartu SORA di portal keluarga, yang masih punya
 * arti sebagai penanda meski tidak bisa diketuk.
 */
function toBankSoalResources(
  tags: { group_id: string; question_bank_item_id: string }[],
  butir: Map<string, { adaPembahasan: boolean; kunci: string | null; aktif: boolean }>,
  topicByGroupId: Map<string, { topic: string; representativeCpId: string }>,
  soraUrl: string | null,
  /** CP dan nama sumber tiap paket (kunci `form:<id>` / `doc:<id>`), bila diketahui. */
  sumberPaket: Map<string, { cpIds: string[]; nama: string | null }>,
): TutorResourceRow[] {
  if (!soraUrl) return []

  // Satu baris per PAKET (satu sumber soal), bukan per topik: dengan begitu tiap paket
  // bisa menunjuk CP-nya, dan paket-paket satu topik bisa dibandingkan dengan
  // materi, asesmen, dan latihan soal yang berlabel CP sama.
  const perPaket = new Map<string, { groupId: string; kunci: string | null; n: number; p: number; aktif: number }>()
  for (const t of tags) {
    if (!t.group_id) continue
    const info = butir.get(t.question_bank_item_id)
    const kunci = info?.kunci ?? null
    const k = `${t.group_id}__${kunci ?? 'bebas'}`
    const e = perPaket.get(k) ?? { groupId: t.group_id, kunci, n: 0, p: 0, aktif: 0 }
    e.n++
    if (info?.adaPembahasan) e.p++
    if (info?.aktif) e.aktif++
    perPaket.set(k, e)
  }

  const out: TutorResourceRow[] = []
  for (const [k, e] of perPaket) {
    const group = topicByGroupId.get(e.groupId)
    // Topik yang tidak punya baris kurikulum tidak punya tempat duduk di tabel
    // ini. Soalnya tetap ada di Sora — yang hilang cuma barisnya di sini.
    if (!group) continue
    const sumber = e.kunci ? sumberPaket.get(e.kunci) : undefined
    out.push({
      id: `bank__${k}`,
      kind: 'bank_soal',
      source: 'sora',
      // Dipakai sebagai tooltip dan sebagai teks cadangan bila CP-nya tidak diketahui.
      title: `${e.n} soal · ${e.p} pembahasan`,
      jumlahSoal: e.n,
      jumlahPembahasan: e.p,
      terjangkau: e.aktif > 0,
      cpIds: sumber?.cpIds ?? [],
      namaSumber: sumber?.nama ?? undefined,
      href: `${soraUrl}/dashboard/bank/${e.groupId}`,
      // Baris ini milik topik, bukan milik sesi mana pun.
      sessionId: '',
      subjectId: '',
      curriculumTopicId: group.representativeCpId,
      customTheme: null,
      topicText: null,
      tutorName: null,
      classGradeLevel: null,
      classSemester: null,
    })
  }
  return out
}

// Classes don't store an exact "Kelas N" grade themselves (only a broad
// SD/SMP/SMA `level`) — the closest ground truth is the mode grade of the
// class's actively enrolled students, same approach as the tutor session
// detail page (app/tutor/sessions/[sessionId]/page.tsx) uses for its
// "sessionGrade".
async function buildClassInfoMap(
  admin: ReturnType<typeof createAdminClient>,
  classIds: string[],
): Promise<Map<string, { gradeLevel: string | null; semester: number | null }>> {
  const map = new Map<string, { gradeLevel: string | null; semester: number | null }>()
  if (classIds.length === 0) return map

  const [{ data: classRows }, { data: enrollmentRows }] = await Promise.all([
    admin.from('classes').select('id, semester').in('id', classIds) as unknown as Promise<{
      data: { id: string; semester: number | null }[] | null
    }>,
    admin
      .from('class_students')
      .select('class_id, profiles(grade)')
      .in('class_id', classIds)
      .eq('is_active', true) as unknown as Promise<{
        data: { class_id: string; profiles: { grade: number | null } | null }[] | null
      }>,
  ])

  const gradesByClass = new Map<string, number[]>()
  for (const e of enrollmentRows ?? []) {
    const grade = e.profiles?.grade
    if (grade == null) continue
    if (!gradesByClass.has(e.class_id)) gradesByClass.set(e.class_id, [])
    gradesByClass.get(e.class_id)!.push(grade)
  }

  const semesterByClass = new Map((classRows ?? []).map(c => [c.id, c.semester]))

  for (const classId of classIds) {
    const grades = gradesByClass.get(classId) ?? []
    const modeGrade = grades.length > 0
      ? grades.sort((a, b) => grades.filter(v => v === b).length - grades.filter(v => v === a).length)[0]
      : null
    map.set(classId, {
      gradeLevel: modeGrade != null ? `Kelas ${modeGrade}` : null,
      semester: semesterByClass.get(classId) ?? null,
    })
  }

  return map
}

/** Membaca SEMUA baris sebuah kueri, per 1.000 (batas PostgREST). `ambil` harus berurutan stabil. */
async function semuaBaris<T>(
  ambil: (dari: number, sampai: number) => PromiseLike<{ data: unknown[] | null }>,
): Promise<T[]> {
  const hasil: T[] = []
  for (let dari = 0; ; dari += 1000) {
    const { data } = await ambil(dari, dari + 999)
    hasil.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) break
  }
  return hasil
}

export default async function MateriLatihanSoalPage() {
  const admin = createAdminClient()

  // Boleh kosong: Sora adalah aplikasi terpisah, dan tanpa alamatnya baris
  // Bank Soal memang tidak dibuat.
  const soraUrl = process.env.NEXT_PUBLIC_SORA_URL?.replace(/\/$/, '') ?? null

  const [{ data: topics }, { data: subjects }, { data: resources }, { data: materialRows }, { data: assessmentRows }, { data: sessionCpUrlRows }, { data: bankTagRows }, { data: duplicationRows }] = await Promise.all([
    admin
      .from('curriculum_topics')
      .select('id, group_id, curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, created_at, subjects(name)')
      .order('subject_id')
      .order('grade_level')
      .order('semester')
      .order('sort_order') as unknown as Promise<{
        data: {
          id: string
          group_id: string | null
          curriculum: string
          subject_id: string
          grade_level: string
          semester: number
          theme: string | null
          topic: string | null
          learning_outcomes: string | null
          sort_order: number
          subjects: { name: string } | null
        }[] | null
      }>,
    admin.from('subjects').select('id, name, curriculum, level').order('name') as unknown as Promise<{
      data: { id: string; name: string; curriculum: string[] | null; level: string[] | null }[] | null
    }>,
    admin
      .from('curriculum_resources')
      .select('id, subject_id, curriculum, grade_level, semester, theme, topic, kind, title, link_url, created_at, readable_at')
      .order('created_at') as unknown as Promise<{
        data: {
          id: string
          subject_id: string
          curriculum: string
          grade_level: string
          semester: number
          theme: string
          topic: string
          kind: 'materi' | 'latihan_soal'
          title: string
          link_url: string
          created_at: string
          readable_at: string | null
        }[] | null
      }>,
    admin
      .from('materials')
      .select('id, title, link_url, file_path, session_id, created_at, sessions(class_id, subject_id, curriculum_topic_id, custom_theme, topic, selected_cp_ids, tutor:profiles!tutor_id(full_name, nickname))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: MaterialSourceRow[] | null }>,
    admin
      .from('assessments')
      .select('id, title, link_url, quiz_id, session_id, created_at, sessions(class_id, subject_id, curriculum_topic_id, custom_theme, topic, selected_cp_ids, tutor:profiles!tutor_id(full_name, nickname))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: MaterialSourceRow[] | null }>,
    admin
      .from('sessions')
      .select('id, class_id, subject_id, custom_theme, topic, selected_cp_ids, cp_urls, custom_learning_outcomes, tutor:profiles!tutor_id(full_name, nickname)')
      .not('cp_urls', 'eq', '{}') as unknown as Promise<{ data: SessionCpUrlRow[] | null }>,
    // PostgREST memotong setiap jawaban di 1.000 baris. Tag soal sudah melewatinya
    // (1.202 baris per 29 Okt 2026), jadi dibaca per halaman — tanpa itu jumlah soal
    // per topik di kolom Bank Soal berkurang diam-diam (mis. 8 padahal 10).
    semuaBaris<{ group_id: string; question_bank_item_id: string }>(
      (dari, sampai) => admin.from('question_curriculum_tags').select('group_id, question_bank_item_id').order('question_bank_item_id').range(dari, sampai),
    ).then(data => ({ data })),
    admin
      .from('curriculum_resource_duplications')
      .select('drive_file_id, copy_link, pdf_path') as unknown as Promise<{
        data: { drive_file_id: string; copy_link: string | null; pdf_path: string | null }[] | null
      }>,
  ])

  const allClassIds = [...new Set([
    ...(materialRows ?? []).map(r => r.sessions?.class_id).filter((v): v is string => !!v),
    ...(assessmentRows ?? []).map(r => r.sessions?.class_id).filter((v): v is string => !!v),
    ...(sessionCpUrlRows ?? []).map(r => r.class_id).filter((v): v is string => !!v),
  ])]
  const classInfoById = await buildClassInfoMap(admin, allClassIds)

  // Satu entri per topik, dengan CP pertamanya sebagai wakil. Baris tanpa
  // `group_id` (belum ter-backfill migrasi 060) tetap dimasukkan dengan id
  // CP-nya sendiri sebagai kunci — sama dengan yang dipakai LatihanSoalTab saat
  // menyimpan, jadi keduanya tetap bertemu.
  const topicByGroupId = new Map<string, { topic: string; representativeCpId: string }>()
  for (const t of topics ?? []) {
    if (!t.topic) continue
    const key = t.group_id ?? t.id
    if (!topicByGroupId.has(key)) {
      topicByGroupId.set(key, { topic: t.topic, representativeCpId: t.id })
    }
  }

  // Pembahasan kosong dan pembahasan berisi spasi sama saja bagi murid yang
  // menjawab salah.
  const idBertag = [...new Set((bankTagRows ?? []).map(t => t.question_bank_item_id))]
  const butirInfo = new Map<string, { adaPembahasan: boolean; kunci: string | null; aktif: boolean }>()
  for (let i = 0; i < idBertag.length; i += 200) {
    const { data } = await admin.from('question_bank_items').select('id, explanation, paket_kunci, status_verifikasi').in('id', idBertag.slice(i, i + 200))
    for (const x of (data ?? []) as { id: string; explanation: string | null; paket_kunci: string | null; status_verifikasi: string | null }[]) {
      butirInfo.set(x.id, { adaPembahasan: (x.explanation ?? '').trim() !== '', kunci: x.paket_kunci, aktif: x.status_verifikasi === 'aktif' })
    }
  }

  // CP tiap paket. Paket dari FORM: dihitung sinkron harian dari sesi tempat form dipakai
  // (kolom `cp_ids`, migrasi 205; tabelnya bisa belum ada/lengkap, jadi galat dilewati).
  // Paket dari DOKUMEN: dari sesi yang menautkan berkas soal itu sebagai latihan soal.
  const sumberPaket = new Map<string, { cpIds: string[]; nama: string | null }>()
  // Paket yang sudah punya butir AKTIF = bisa dikerjakan anak di /belajar (butir draf tidak tampil).
  const paketAktif = new Set([...butirInfo.values()].filter(b => b.aktif && b.kunci).map(b => b.kunci as string))
  const formAktif = new Set<string>()
  const { data: catatanForm } = await admin.from('sinkron_soal_drive').select('file_id, nama, cp_ids, terbit_id')
  for (const f of (catatanForm ?? []) as { file_id: string; nama: string; cp_ids: string[] | null; terbit_id: string | null }[]) {
    sumberPaket.set(`form:${f.file_id}`, { cpIds: f.cp_ids ?? [], nama: f.nama })
    if (f.terbit_id && paketAktif.has(`form:${f.file_id}`)) formAktif.add(f.terbit_id)
  }
  for (const sesi of sessionCpUrlRows ?? []) {
    for (const url of Object.values(sesi.cp_urls ?? {})) {
      const berkas = extractDriveFileId(url ?? '')
      if (!berkas) continue
      const k = `doc:${berkas}`
      const ada = sumberPaket.get(k) ?? { cpIds: [], nama: null }
      sumberPaket.set(k, { cpIds: [...new Set([...ada.cpIds, ...(sesi.selected_cp_ids ?? [])])], nama: ada.nama })
    }
  }

  const tutorResources: TutorResourceRow[] = [
    // Lampiran jurnal, bukan materi kurikulum — lihat `DisplayKind` di tabelnya.
    ...toTutorResources(materialRows ?? [], 'lampiran', classInfoById, soraUrl),
    ...toTutorResources(assessmentRows ?? [], 'asesmen', classInfoById, soraUrl),
    ...toLatihanSoalResources(sessionCpUrlRows ?? [], topicByGroupId, classInfoById),
    ...toBankSoalResources(bankTagRows ?? [], butirInfo, topicByGroupId, soraUrl, sumberPaket),
  ]

  // Asesmen (Google Form) dan latihan soal (dokumen) yang sudah didigitalkan jadi paket
  // soal aktif ditandai bisa dikerjakan di /belajar.
  // Tautan pendek (forms.gle) diikuti satu lompatan ke id terbitnya; hasilnya di-cache sehari.
  const idDariPendek = new Map<string, string | null>()
  const pendek = [...new Set(tutorResources.filter(r => r.kind === 'asesmen' && /forms\.gle\//.test(r.href)).map(r => r.href))]
  await Promise.all(pendek.map(async u => {
    try {
      const res = await fetch(u, { redirect: 'manual', next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) })
      idDariPendek.set(u, idTerbit(res.headers.get('location')))
    } catch {
      idDariPendek.set(u, null)
    }
  }))
  for (const r of tutorResources) {
    if (r.kind === 'asesmen') {
      const id = idTerbit(r.href) ?? idDariPendek.get(r.href) ?? null
      if (id && formAktif.has(id)) r.terjangkau = true
    } else if (r.kind === 'latihan_soal') {
      const f = extractDriveFileId(r.href)
      if (f && paketAktif.has(`doc:${f}`)) r.terjangkau = true
    }
  }

  // Berapa materi yang benar-benar terbaca di dalam halaman. Dihitung dari
  // `curriculum_resources` saja — itu satu-satunya sumber yang dibaca
  // `/belajar` (lihat `materiTopik()`), jadi menghitung yang lain akan
  // menghasilkan angka yang tidak menjelaskan layar mana pun.
  //
  // "Terbaca" berarti `readable_at` terisi (migrasi 127), bukan `pdf_path` di
  // tabel salinan: sejak materi dibaca langsung dari Drive, bucket kosong dan
  // `pdf_path` tidak lagi menyatakan apa-apa — panel ini dulu menulis "0 dari
  // 168" untuk 158 materi yang sebenarnya terbuka.
  let terbaca = 0
  let menungguAkses = 0
  let tautanLuar = 0
  // Kapan terakhir disinkronkan: setiap sinkron (tombol, tugas harian, atau
  // skrip) menandai ulang `readable_at` semua materi yang siap, jadi yang
  // terbaru di antaranya adalah waktu sinkron terakhir. Ditaruh di database,
  // bukan dibaca dari env: halaman ini berjalan di dua server (Vercel dan
  // Netlify) dan hanya satu yang menjadwalkan tugasnya.
  let terakhirSinkron: string | null = null
  for (const r of resources ?? []) {
    if (r.kind !== 'materi') continue
    // Bukan berkas Drive: folder, Google Form terbitan, atau situs lain.
    // Ketiganya tidak bisa disemat, dan tidak ada yang bisa kita perbuat.
    if (!extractDriveFileId(r.link_url)) tautanLuar++
    else if (r.readable_at) {
      terbaca++
      if (!terakhirSinkron || r.readable_at > terakhirSinkron) terakhirSinkron = r.readable_at
    }
    else menungguAkses++
  }

  // Buku catatan sinkron soal digital (migrasi 202). Tabelnya bisa belum ada
  // selama migrasi belum dijalankan: panelnya sekadar tidak ditampilkan.
  let ringkasanSoal: RingkasanSoal | null = null
  {
    const { data: catatan, error } = await admin
      .from('sinkron_soal_drive')
      .select('nama, jalur, status, catatan, diperiksa_at')
      .order('diperiksa_at', { ascending: false })
      .limit(1000)
    if (!error) {
      const baris = (catatan ?? []) as { nama: string; jalur: string; status: string; catatan: string | null; diperiksa_at: string }[]
      ringkasanSoal = {
        selesai: baris.filter(b => b.status === 'selesai' || b.status === 'tanpa_topik').length,
        tanpaTopik: baris.filter(b => b.status === 'tanpa_topik').map(b => ({ nama: b.nama, jalur: b.jalur })),
        perluTinjauan: baris.filter(b => b.status === 'perlu_tinjauan').map(b => ({ nama: b.nama, catatan: b.catatan })),
        galat: baris.filter(b => b.status === 'galat').map(b => ({ nama: b.nama, catatan: b.catatan })),
        terakhir: baris[0]?.diperiksa_at ?? null,
      }
    }
  }

  // Label CP per item: nomor "tema.topik.CP" dan teksnya DIHITUNG dari kurikulum saat
  // ini (fungsi yang sama dengan menu Kurikulum), tidak disimpan di mana pun —
  // jadi kalau kurikulum diubah, tabel ini ikut berubah.
  const nomorCp = nomorKurikulum(
    (topics ?? []).map(t => ({
      id: t.id, curriculum: t.curriculum, grade_level: t.grade_level, semester: t.semester,
      theme: t.theme, topic: t.topic, learning_outcomes: t.learning_outcomes, sort_order: t.sort_order,
      created_at: (t as { created_at?: string | null }).created_at ?? null,
      subjectName: (t.subjects as { name?: string } | null)?.name ?? 'Lainnya',
    })),
  )
  const cpInfo: Record<string, { nomor: string; teks: string; topicKey: string }> = {}
  for (const t of topics ?? []) {
    if (t.learning_outcomes === null || !t.learning_outcomes.trim() || !t.topic) continue
    const n = nomorCp.get(t.id)
    if (!n) continue
    cpInfo[t.id] = {
      nomor: formatNomor(n),
      teks: t.learning_outcomes.trim(),
      topicKey: `${t.subject_id}__${t.grade_level}__${t.semester}__${t.theme}__${t.topic}`,
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Materi dan Latihan Soal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kumpulan materi, latihan soal, dan asesmen per topik, mengikuti struktur Kurikulum</p>
      </div>

      <StatusMateriPanel terbaca={terbaca} menungguAkses={menungguAkses} tautanLuar={tautanLuar} terakhirSinkron={terakhirSinkron} />

      {ringkasanSoal && <SinkronSoalPanel ringkasan={ringkasanSoal} />}

      <MateriLatihanSoalClient
        topics={topics ?? []}
        subjects={(subjects ?? []).map(s => ({ ...s, curriculum: s.curriculum ?? [], level: s.level ?? [] }))}
        resources={resources ?? []}
        tutorResources={tutorResources}
        cpInfo={cpInfo}
        duplications={(duplicationRows ?? []).map(r => ({ driveFileId: r.drive_file_id, copyLink: r.copy_link }))}
        soraUrl={soraUrl}
        createResourceAction={createCurriculumResource}
        deleteResourceAction={deleteCurriculumResource}
      />
    </div>
  )
}
