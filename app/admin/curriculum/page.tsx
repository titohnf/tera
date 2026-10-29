import { createAdminClient } from '@/lib/supabase/server-admin'
import { createCurriculumTopic, createCurriculumThemes, createCurriculumTopics, createCurriculumCPs, updateCurriculumTopic, deleteCurriculumTopic, renameTheme, deleteTheme, moveTheme, renameTopic, deleteTopic } from '@/lib/actions/admin/curriculum'
import CurriculumClient from '@/components/admin/curriculum/CurriculumClient'

export default async function CurriculumPage() {
  const admin = createAdminClient()

  const [{ data: topics }, { data: subjects }] = await Promise.all([
    admin
      .from('curriculum_topics')
      .select('id, curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, created_at, subjects(name)')
      .order('subject_id')
      .order('grade_level')
      .order('semester')
      .order('sort_order')
      // Pemutus seri yang sama dengan `nomorKurikulum`: urutan baris yang tampil dan nomornya tidak boleh berbeda.
      .order('created_at')
      .order('id') as unknown as Promise<{
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
          created_at: string | null
          subjects: { name: string } | null
        }[] | null
      }>,
    admin.from('subjects').select('id, name, curriculum, level').order('name') as unknown as Promise<{
      data: { id: string; name: string; curriculum: string[] | null; level: string[] | null }[] | null
    }>,
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Kurikulum</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola topik dan capaian pembelajaran per mata pelajaran</p>
      </div>

      <CurriculumClient
        topics={topics ?? []}
        subjects={(subjects ?? []).map(s => ({ ...s, curriculum: s.curriculum ?? [], level: s.level ?? [] }))}
        createAction={createCurriculumTopic}
        createThemesAction={createCurriculumThemes}
        createTopicsAction={createCurriculumTopics}
        createCPsAction={createCurriculumCPs}
        renameThemeAction={renameTheme}
        deleteThemeAction={deleteTheme}
        moveThemeAction={moveTheme}
        renameTopicAction={renameTopic}
        deleteTopicAction={deleteTopic}
        updateAction={updateCurriculumTopic}
        deleteAction={deleteCurriculumTopic}
      />
    </div>
  )
}
