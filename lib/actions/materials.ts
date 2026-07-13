'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { checkAndCompleteSession } from './session-completion'
import { isSessionTutor } from './session-access'

export async function addFileMaterial(sessionId: string, payload: {
  title: string
  file_path: string
  file_size_bytes: number
  mime_type: string
}) {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()
  if (!(await isSessionTutor(admin, sessionId, user.id))) return { error: 'Sesi tidak ditemukan' }

  const { error } = await admin.from('materials').insert({
    session_id: sessionId,
    uploaded_by: user.id,
    title: payload.title,
    file_path: payload.file_path,
    file_size_bytes: payload.file_size_bytes,
    mime_type: payload.mime_type,
    link_url: null,
  })

  if (error) return { error: error.message }

  await checkAndCompleteSession(sessionId)

  revalidatePath(`/tutor/sessions/${sessionId}/materials`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}

export async function addLinkMaterial(sessionId: string, payload: {
  title: string
  link_url: string
}) {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  if (!payload.title.trim()) return { error: 'Judul wajib diisi.' }

  let url = payload.link_url.trim()
  if (!url) return { error: 'Link wajib diisi.' }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const admin = createAdminClient()
  if (!(await isSessionTutor(admin, sessionId, user.id))) return { error: 'Sesi tidak ditemukan' }

  const { error } = await admin.from('materials').insert({
    session_id: sessionId,
    uploaded_by: user.id,
    title: payload.title,
    file_path: null,
    link_url: url,
  })

  if (error) return { error: error.message }

  await checkAndCompleteSession(sessionId)

  revalidatePath(`/tutor/sessions/${sessionId}/materials`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}

export async function deleteMaterial(materialId: string, filePath: string | null, sessionId: string) {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  if (filePath) {
    const supabase = await createClient()
    const { error: storageError } = await supabase.storage
      .from('session-materials')
      .remove([filePath])
    if (storageError) return { error: storageError.message }
  }

  const { error: dbError } = await admin
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('uploaded_by', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath(`/tutor/sessions/${sessionId}/materials`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}

export async function getSignedUrl(filePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('session-materials')
    .createSignedUrl(filePath, 3600)

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}
