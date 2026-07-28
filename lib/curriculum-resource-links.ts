import type { createAdminClient } from '@/lib/supabase/server-admin'

// Extracts a Google Drive file id from a docs.google.com/drive.google.com
// link (e.g. .../document/d/FILE_ID/edit, .../file/d/FILE_ID/view). Returns
// null for published Google Forms links (.../forms/d/e/PUBLISHED_ID/viewform)
// since that id is not the form's real Drive file id and can't be used to
// copy the file — only the owner's .../forms/d/FILE_ID/edit link exposes
// that. Also null for anything not hosted on Drive at all (Wordwall,
// Wayground, Kahoot, etc).
export function extractDriveFileId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname)) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

// Gathers every materi/bank-soal/asesmen link across the app (admin-added
// curriculum_resources, tutor-submitted materials/assessments, and the
// per-CP bank soal urls on sessions.cp_urls — see BankSoalTab.tsx) and
// dedupes to the underlying Drive file id, keyed to a representative title
// used when naming the duplicated copy.
export async function collectAllResourceLinks(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<string, string>> {
  const [{ data: curriculumResources }, { data: materials }, { data: assessments }, { data: topics }, { data: sessionsWithCpUrls }] = await Promise.all([
    admin.from('curriculum_resources').select('title, link_url') as unknown as Promise<{
      data: { title: string; link_url: string }[] | null
    }>,
    admin.from('materials').select('title, link_url').not('link_url', 'is', null) as unknown as Promise<{
      data: { title: string; link_url: string | null }[] | null
    }>,
    admin.from('assessments').select('title, link_url').not('link_url', 'is', null) as unknown as Promise<{
      data: { title: string; link_url: string | null }[] | null
    }>,
    admin.from('curriculum_topics').select('id, learning_outcomes') as unknown as Promise<{
      data: { id: string; learning_outcomes: string | null }[] | null
    }>,
    admin
      .from('sessions')
      .select('cp_urls, custom_learning_outcomes')
      .not('cp_urls', 'eq', '{}') as unknown as Promise<{
        data: { cp_urls: Record<string, string> | null; custom_learning_outcomes: string[] | null }[] | null
      }>,
  ])

  const topicsById = new Map((topics ?? []).map(t => [t.id, t.learning_outcomes]))
  const byFileId = new Map<string, string>()

  function add(title: string, link: string | null | undefined) {
    if (!link) return
    const fileId = extractDriveFileId(link)
    if (!fileId || byFileId.has(fileId)) return
    byFileId.set(fileId, title)
  }

  for (const r of curriculumResources ?? []) add(r.title, r.link_url)
  for (const r of materials ?? []) add(r.title, r.link_url)
  for (const r of assessments ?? []) add(r.title, r.link_url)
  for (const s of sessionsWithCpUrls ?? []) {
    if (!s.cp_urls) continue
    for (const [cpId, url] of Object.entries(s.cp_urls)) {
      const isCustom = cpId.startsWith('custom-')
      const title = isCustom
        ? s.custom_learning_outcomes?.[Number(cpId.slice('custom-'.length))] ?? 'Bank Soal'
        : topicsById.get(cpId) ?? 'Bank Soal'
      add(title, url)
    }
  }

  return byFileId
}
