'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { bolehBacaMurid } from '@/lib/akses'

export type JadwalSessionDetail = {
  tema: string | null
  topik: string | null
  cp_list: { id: string; label: string }[]
  /**
   * Materi topik sesi ini, DARI PERPUSTAKAAN — bukan dari lampiran jurnal.
   *
   * Sebelumnya baris ini datang dari `materials`: tautan yang ditempel tutor
   * sendiri di jurnalnya. Itu berarti materi diurus di dua tempat, dan yang
   * kedua menghasilkan tautan ke Drive pribadi tutor — berakhir di layar "Anda
   * memerlukan akses" bagi keluarga yang mengetuknya. 96% di antaranya pun
   * ternyata dokumen yang sama dengan materi katalognya.
   *
   * Sekarang ditelusuri dari topik sesi ke `curriculum_resources`, dan hanya
   * yang `readable_at`-nya terisi. Tutor tidak perlu menempel apa pun; materi
   * yang ditaruh admin di folder bimbel muncul dengan sendirinya di sesi mana
   * pun yang membahas topik itu.
   */
  materi_list: { id: string; title: string; groupId: string }[]
  assessments: { id: string; title: string; score: number | null; max_score: number; link_url: string | null; level: string | null }[]
  catatan: string | null
  attendance_notes: string | null
}

/** Kosong, dipakai saat pemanggil tidak berhak — bukan melempar, supaya baris
 *  yang dibuka cuma tidak berisi apa-apa alih-alih merusak halaman. */
const DETAIL_KOSONG: JadwalSessionDetail = {
  tema: null,
  topik: null,
  cp_list: [],
  materi_list: [],
  assessments: [],
  catatan: null,
  attendance_notes: null,
}

/**
 * Isi satu baris sesi yang dibuka di tabel jadwal.
 *
 * Server action ini memakai service role dan SEBELUMNYA tidak memeriksa apa
 * pun: siapa saja yang bisa memanggilnya mendapat catatan tutor, catatan
 * kehadiran, dan nilai asesmen murid mana pun. Yang menahannya hanya kebetulan
 * — cuma halaman admin yang memuat komponennya, jadi cuma bundel admin yang
 * membawa id action-nya. Itu bukan penjagaan.
 *
 * Sekarang penjaganya eksplisit, dan itulah yang memungkinkan tabel yang sama
 * dipakai di portal keluarga: aturan siapa boleh membaca apa dijawab di sini,
 * bukan oleh halaman mana yang kebetulan merendernya.
 */
export async function getJadwalSessionDetail(
  sessionId: string,
  studentId: string,
): Promise<JadwalSessionDetail> {
  if (!(await bolehBacaMurid(studentId))) return DETAIL_KOSONG

  const admin = createAdminClient()

  const [sessionRes, attendanceRes, noteRes] = await Promise.all([
    admin
      .from('sessions')
      .select('curriculum_topic_id, selected_cp_ids, topic, custom_theme, custom_learning_outcomes')
      .eq('id', sessionId)
      .maybeSingle() as unknown as Promise<{
        data: {
          curriculum_topic_id: string | null
          selected_cp_ids: string[] | null
          topic: string | null
          custom_theme: string | null
          custom_learning_outcomes: string[] | null
        } | null
        error: unknown
      }>,
    admin
      .from('attendances')
      .select('notes')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle() as unknown as Promise<{ data: { notes: string | null } | null }>,
    admin
      .from('performance_notes')
      .select('body')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle() as unknown as Promise<{ data: { body: string } | null }>,
  ])

  type AssessmentRow = { id: string; title: string; max_score: number; link_url: string | null }
  const assessmentQuery = await (admin
    .from('assessments')
    .select('id, title, max_score, link_url')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true }) as unknown as Promise<{ data: AssessmentRow[] | null }>)
  const assessmentRows = assessmentQuery.data

  const session = sessionRes.data

  // Latihan soal tidak lagi ditampilkan di rincian sesi. `sessions.cp_urls`
  // tetap ada dan tetap diisi tutor — halaman admin masih membacanya — tapi
  // keluarga membukanya lewat `/belajar`, yang menyusunnya per topik kurikulum
  // dan bukan per pertemuan. Dua pintu ke bahan yang sama, satu di antaranya
  // menuntut tutor menempel tautan, adalah pekerjaan yang tidak perlu ada.

  const selectedIds: string[] = session?.selected_cp_ids ?? []

  const allCurriculumIds = [
    ...(session?.curriculum_topic_id ? [session.curriculum_topic_id] : []),
    ...selectedIds,
  ]

  let tema: string | null = null
  let topik: string | null = null
  let cp_list: JadwalSessionDetail['cp_list'] = []
  const grupTopik = new Set<string>()

  if (allCurriculumIds.length > 0) {
    const { data: ctRows } = await admin
      .from('curriculum_topics')
      .select('id, group_id, theme, topic, learning_outcomes')
      .in('id', allCurriculumIds) as unknown as {
        data: { id: string; group_id: string | null; theme: string | null; topic: string; learning_outcomes: string | null }[] | null
      }

    const ctMap = new Map((ctRows ?? []).map(r => [r.id, r]))

    const mainId = session?.curriculum_topic_id
    const mainRow = mainId ? ctMap.get(mainId) : null
    const fallbackRow = !mainRow && selectedIds.length > 0 ? ctMap.get(selectedIds[0]) : null
    const sourceRow = mainRow ?? fallbackRow ?? null

    tema  = sourceRow?.theme ?? null
    topik = sourceRow?.topic ?? null

    cp_list = selectedIds.map(id => {
      const row = ctMap.get(id)
      return { id, label: row?.learning_outcomes ?? row?.topic ?? id }
    })

    // Topik sesi ini, sebagai kunci ke perpustakaan.
    for (const id of allCurriculumIds) {
      const g = ctMap.get(id)?.group_id
      if (g) grupTopik.add(g)
    }
  } else if (session && (session.custom_theme || (session.custom_learning_outcomes?.length ?? 0) > 0)) {
    // Kelas privat — tutor-authored tema/topik/CP, not linked to curriculum_topics
    tema = session.custom_theme
    topik = session.topic
    cp_list = (session.custom_learning_outcomes ?? []).map((text, i) => ({
      id: `custom-${i}`,
      label: text,
    }))

  }

  const assessmentList = assessmentRows ?? []
  let assessments: JadwalSessionDetail['assessments'] = []

  if (assessmentList.length > 0) {
    const aIds = assessmentList.map(a => a.id)
    const { data: results } = await (admin
      .from('assessment_results')
      .select('assessment_id, score, feedback')
      .eq('student_id', studentId)
      .in('assessment_id', aIds) as unknown as Promise<{ data: { assessment_id: string; score: number | null; feedback: string | null }[] | null }>)

    const resultMap = new Map((results ?? []).map((r: { assessment_id: string; score: number | null; feedback: string | null }) => [r.assessment_id, r]))
    assessments = assessmentList.map((a: AssessmentRow) => ({
      id: a.id,
      title: a.title,
      score: resultMap.get(a.id)?.score ?? null,
      max_score: a.max_score,
      link_url: a.link_url,
      level: resultMap.get(a.id)?.feedback ?? null,
    }))
  }

  // Materi topik sesi ini, dari perpustakaan. Hanya yang `readable_at`-nya
  // terisi: yang belum terjangkau tidak pantas disebut kepada keluarga, sama
  // seperti di `/belajar` — sebuah tautan yang berakhir di layar "Anda
  // memerlukan akses" lebih buruk daripada tidak ada tautan.
  let materi_list: JadwalSessionDetail['materi_list'] = []
  if (grupTopik.size > 0) {
    const { data: mRows } = await (admin
      .from('curriculum_resources')
      .select('id, title, group_id')
      .eq('kind', 'materi')
      .not('readable_at', 'is', null)
      .in('group_id', [...grupTopik])
      .order('title') as unknown as Promise<{ data: { id: string; title: string; group_id: string | null }[] | null }>)
    materi_list = (mRows ?? [])
      .filter(r => r.group_id)
      .map(r => ({ id: r.id, title: r.title, groupId: r.group_id as string }))
  }

  return {
    tema,
    topik,
    cp_list,
    materi_list,
    assessments,
    catatan: noteRes.data?.body ?? null,
    attendance_notes: attendanceRes.data?.notes ?? null,
  }
}
