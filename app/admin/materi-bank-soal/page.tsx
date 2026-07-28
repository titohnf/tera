import { createAdminClient } from '@/lib/supabase/server-admin'
import { createCurriculumResource, deleteCurriculumResource } from '@/lib/actions/admin/curriculum-resources'
import { runResourceDuplication } from '@/lib/actions/admin/curriculum-resource-duplication'
import { collectAllResourceLinks } from '@/lib/curriculum-resource-links'
import MateriBankSoalClient from '@/components/admin/materi-bank-soal/MateriBankSoalClient'
import DuplicationStatusPanel from '@/components/admin/materi-bank-soal/DuplicationStatusPanel'

type MaterialSourceRow = {
  id: string
  title: string
  link_url: string | null
  file_path?: string | null
  session_id: string
  created_at: string
  sessions: {
    class_id: string
    subject_id: string | null
    curriculum_topic_id: string | null
    custom_theme: string | null
    topic: string | null
    tutor: { full_name: string } | null
  } | null
}

// Bank soal is captured per-CP on the session itself (sessions.cp_urls, a
// {cpId: url} map — see components/admin/sessions/BankSoalTab.tsx), not in
// the `assessments` table. `assessments` is the separate "Asesmen" grading
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
  tutor: { full_name: string } | null
}

export type TutorResourceRow = {
  id: string
  kind: 'materi' | 'bank_soal' | 'asesmen'
  title: string
  href: string
  sessionId: string
  subjectId: string
  curriculumTopicId: string | null
  customTheme: string | null
  topicText: string | null
  tutorName: string | null
  // Best-effort Kelas/Semester for entries with no formal curriculum link —
  // derived from the session's class (its own `semester` column, and the
  // mode grade of its enrolled students) so the columns aren't just "—".
  classGradeLevel: string | null
  classSemester: number | null
}

function toTutorResources(
  rows: MaterialSourceRow[],
  kind: 'materi' | 'asesmen',
  classInfoById: Map<string, { gradeLevel: string | null; semester: number | null }>,
): TutorResourceRow[] {
  return rows
    .filter(r => r.sessions?.subject_id)
    .map(r => {
      const classInfo = classInfoById.get(r.sessions!.class_id)
      return {
        id: r.id,
        kind,
        title: r.title,
        // Uploaded files (or assessments without a link) aren't directly
        // linkable here — send the admin to the session's own tab instead.
        href: r.link_url ?? `/admin/sessions/${r.session_id}`,
        sessionId: r.session_id,
        subjectId: r.sessions!.subject_id!,
        curriculumTopicId: r.sessions!.curriculum_topic_id,
        customTheme: r.sessions!.custom_theme,
        topicText: r.sessions!.topic,
        tutorName: r.sessions!.tutor?.full_name ?? null,
        classGradeLevel: classInfo?.gradeLevel ?? null,
        classSemester: classInfo?.semester ?? null,
      }
    })
}

function toBankSoalResources(
  sessionRows: SessionCpUrlRow[],
  topicsById: Map<string, { learning_outcomes: string | null }>,
  classInfoById: Map<string, { gradeLevel: string | null; semester: number | null }>,
): TutorResourceRow[] {
  const out: TutorResourceRow[] = []
  for (const s of sessionRows) {
    if (!s.subject_id || !s.cp_urls) continue
    const classInfo = classInfoById.get(s.class_id)
    for (const [cpId, url] of Object.entries(s.cp_urls)) {
      if (!url?.trim()) continue
      const isCustom = cpId.startsWith('custom-')
      const customIndex = isCustom ? Number(cpId.slice('custom-'.length)) : -1
      const title = isCustom
        ? s.custom_learning_outcomes?.[customIndex] ?? 'Bank Soal'
        : topicsById.get(cpId)?.learning_outcomes ?? 'Bank Soal'
      out.push({
        id: `${s.id}__${cpId}`,
        kind: 'bank_soal',
        title,
        href: url,
        sessionId: s.id,
        subjectId: s.subject_id,
        curriculumTopicId: isCustom ? null : cpId,
        customTheme: isCustom ? s.custom_theme : null,
        topicText: isCustom ? s.topic : null,
        tutorName: s.tutor?.full_name ?? null,
        classGradeLevel: classInfo?.gradeLevel ?? null,
        classSemester: classInfo?.semester ?? null,
      })
    }
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

export default async function MateriBankSoalPage() {
  const admin = createAdminClient()

  const [{ data: topics }, { data: subjects }, { data: resources }, { data: materialRows }, { data: assessmentRows }, { data: sessionCpUrlRows }, { data: duplicationRows }] = await Promise.all([
    admin
      .from('curriculum_topics')
      .select('id, curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, subjects(name)')
      .order('subject_id')
      .order('grade_level')
      .order('semester')
      .order('sort_order') as unknown as Promise<{
        data: {
          id: string
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
      .select('id, subject_id, curriculum, grade_level, semester, theme, topic, kind, title, link_url, created_at')
      .order('created_at') as unknown as Promise<{
        data: {
          id: string
          subject_id: string
          curriculum: string
          grade_level: string
          semester: number
          theme: string
          topic: string
          kind: 'materi' | 'bank_soal'
          title: string
          link_url: string
          created_at: string
        }[] | null
      }>,
    admin
      .from('materials')
      .select('id, title, link_url, file_path, session_id, created_at, sessions(class_id, subject_id, curriculum_topic_id, custom_theme, topic, tutor:profiles!tutor_id(full_name))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: MaterialSourceRow[] | null }>,
    admin
      .from('assessments')
      .select('id, title, link_url, session_id, created_at, sessions(class_id, subject_id, curriculum_topic_id, custom_theme, topic, tutor:profiles!tutor_id(full_name))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: MaterialSourceRow[] | null }>,
    admin
      .from('sessions')
      .select('id, class_id, subject_id, custom_theme, topic, selected_cp_ids, cp_urls, custom_learning_outcomes, tutor:profiles!tutor_id(full_name)')
      .not('cp_urls', 'eq', '{}') as unknown as Promise<{ data: SessionCpUrlRow[] | null }>,
    admin
      .from('curriculum_resource_duplications')
      .select('drive_file_id, duplicated_at') as unknown as Promise<{
        data: { drive_file_id: string; duplicated_at: string }[] | null
      }>,
  ])

  const allClassIds = [...new Set([
    ...(materialRows ?? []).map(r => r.sessions?.class_id).filter((v): v is string => !!v),
    ...(assessmentRows ?? []).map(r => r.sessions?.class_id).filter((v): v is string => !!v),
    ...(sessionCpUrlRows ?? []).map(r => r.class_id).filter((v): v is string => !!v),
  ])]
  const classInfoById = await buildClassInfoMap(admin, allClassIds)

  const topicsById = new Map((topics ?? []).map(t => [t.id, { learning_outcomes: t.learning_outcomes }]))
  const tutorResources: TutorResourceRow[] = [
    ...toTutorResources(materialRows ?? [], 'materi', classInfoById),
    ...toTutorResources(assessmentRows ?? [], 'asesmen', classInfoById),
    ...toBankSoalResources(sessionCpUrlRows ?? [], topicsById, classInfoById),
  ]

  const doneFileIds = new Set((duplicationRows ?? []).map(r => r.drive_file_id))
  const allResourceLinks = await collectAllResourceLinks(admin)
  const pendingCount = [...allResourceLinks.keys()].filter(fileId => !doneFileIds.has(fileId)).length
  const lastDuplicatedAt = (duplicationRows ?? []).reduce<string | null>((latest, r) => {
    if (!latest || r.duplicated_at > latest) return r.duplicated_at
    return latest
  }, null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Materi dan Bank Soal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kumpulan materi, bank soal, dan asesmen per topik, mengikuti struktur Kurikulum</p>
      </div>

      <DuplicationStatusPanel
        lastDuplicatedAt={lastDuplicatedAt}
        pendingCount={pendingCount}
        runAction={runResourceDuplication}
      />

      <MateriBankSoalClient
        topics={topics ?? []}
        subjects={(subjects ?? []).map(s => ({ ...s, curriculum: s.curriculum ?? [], level: s.level ?? [] }))}
        resources={resources ?? []}
        tutorResources={tutorResources}
        duplicatedFileIds={(duplicationRows ?? []).map(r => r.drive_file_id)}
        createResourceAction={createCurriculumResource}
        deleteResourceAction={deleteCurriculumResource}
      />
    </div>
  )
}
