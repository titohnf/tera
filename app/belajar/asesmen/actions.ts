'use server'

import { redirect } from 'next/navigation'
import { belajarContext } from '@/lib/belajar/konteks'
import { createClient } from '@/lib/supabase/server'

/**
 * Aksi asesmen — tipis, dan tidak pernah menerima learner id dari browser.
 * Yang datang cuma id penugasan dan id anak; gerbangnya
 * `family_covers_student()` di dalam fungsi database (migrasi 201).
 */

export async function mulaiAsesmen(
  assessmentId: string,
  anak: string | undefined
): Promise<{ error: string } | never> {
  const { studentId } = await belajarContext(anak)
  if (!studentId) redirect('/belajar')

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('mulai_asesmen_anak', {
    p_assessment: assessmentId,
    p_student: studentId,
  })
  if (error || !data) return { error: error?.message ?? 'Tidak bisa memulai asesmen.' }
  redirect(`/belajar/asesmen/${data as string}?anak=${studentId}`)
}

export async function simpanJawabanAsesmen(
  attemptId: string,
  soalId: string,
  jawaban: unknown
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('simpan_jawaban_asesmen', {
    p_attempt: attemptId,
    p_question: soalId,
    p_response: jawaban ?? null,
  })
  if (error) console.error('[belajar] gagal menyimpan jawaban asesmen:', error)
  return data === true
}

export async function kirimAsesmen(
  attemptId: string,
  anak: string | undefined
): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('kirim_asesmen_anak', { p_attempt: attemptId })
  if (error) return { error: 'Asesmen belum terkirim. Coba tekan sekali lagi.' }
  redirect(anak ? `/belajar?anak=${anak}&asesmen=selesai` : '/belajar')
}
