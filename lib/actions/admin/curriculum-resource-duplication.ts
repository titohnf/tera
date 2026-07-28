'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { getDriveClient } from '@/lib/google-drive'
import { collectAllResourceLinks } from '@/lib/curriculum-resource-links'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export type DuplicationRunResult = {
  succeeded: number
  failed: number
  failedTitles: string[]
} | { error: string }

export async function runResourceDuplication(): Promise<DuplicationRunResult> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { admin } = ctx

  const folderId = process.env.GOOGLE_DRIVE_MATERI_FOLDER_ID
  if (!folderId) return { error: 'GOOGLE_DRIVE_MATERI_FOLDER_ID belum diatur' }

  let drive: ReturnType<typeof getDriveClient>
  try {
    drive = getDriveClient()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Gagal menyiapkan koneksi Google Drive' }
  }

  const allLinks = await collectAllResourceLinks(admin)

  const { data: existing } = await admin.from('curriculum_resource_duplications').select('drive_file_id')
  const alreadyDone = new Set((existing ?? []).map(r => r.drive_file_id))

  const pending = [...allLinks.entries()].filter(([fileId]) => !alreadyDone.has(fileId))

  let succeeded = 0
  const failedTitles: string[] = []

  for (const [fileId, title] of pending) {
    try {
      await drive.files.copy({
        fileId,
        requestBody: { name: title, parents: [folderId] },
        fields: 'id',
      })
      await admin.from('curriculum_resource_duplications').insert({ drive_file_id: fileId })
      succeeded++
    } catch {
      failedTitles.push(title)
    }
  }

  revalidatePath('/admin/materi-bank-soal')

  return { succeeded, failed: failedTitles.length, failedTitles }
}
