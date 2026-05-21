'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function uploadFileMaterialAdmin(sessionId: string, formData: FormData) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string)?.trim()
  if (!file || !title) return { error: 'Judul dan file wajib diisi.' }

  const { data: session } = await ctx.admin.from('sessions').select('id, tutor_id').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }

  const ext = file.name.split('.').pop()
  const filePath = `${session.tutor_id}/${sessionId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await ctx.admin.storage
    .from('session-materials')
    .upload(filePath, arrayBuffer, { contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { error } = await ctx.admin.from('materials').insert({
    session_id: sessionId,
    uploaded_by: ctx.user.id,
    title,
    file_path: filePath,
    file_size_bytes: file.size,
    mime_type: file.type,
    link_url: null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}/materials`)
  return { success: true }
}

export async function addLinkMaterialAdmin(sessionId: string, payload: { title: string; link_url: string }) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  if (!payload.title.trim()) return { error: 'Judul wajib diisi.' }
  let url = payload.link_url.trim()
  if (!url) return { error: 'Link wajib diisi.' }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const { data: session } = await ctx.admin.from('sessions').select('id').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }

  const { error } = await ctx.admin.from('materials').insert({
    session_id: sessionId,
    uploaded_by: ctx.user.id,
    title: payload.title,
    file_path: null,
    link_url: url,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}/materials`)
  return { success: true }
}

export async function deleteMaterialAdmin(materialId: string, filePath: string | null, sessionId: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  if (filePath) {
    const { error: storageError } = await ctx.admin.storage.from('session-materials').remove([filePath])
    if (storageError) return { error: storageError.message }
  }

  const { error } = await ctx.admin.from('materials').delete().eq('id', materialId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}/materials`)
  return { success: true }
}

export async function getSignedUrlAdmin(filePath: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data, error } = await ctx.admin.storage.from('session-materials').createSignedUrl(filePath, 3600)
  if (error) return { error: error.message }
  return { url: data.signedUrl }
}
