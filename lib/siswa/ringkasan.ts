import { createAdminClient } from '@/lib/supabase/server-admin'
import { learnerAnak } from '@/lib/belajar/sesi'
import { kemajuanMisi } from '@/lib/belajar/kemajuan-misi'

export interface RingkasanSiswa {
  /** Topik Misi Matematika yang tuntas, dan seluruhnya; null bila belum terbaca. */
  misi: { tuntas: number; total: number } | null
  /** Banyak try out berbeda yang sudah dikirim. */
  tryOut: number
}

/**
 * Angka-angka untuk halaman Profil siswa. Hanya MEMBACA (tidak membuat baris
 * pelajar), dan gagal apa pun menjadi nol/null: ringkasan ini pelengkap dan
 * tidak boleh merusak halamannya. Pemanggil harus sudah memastikan `studentId`
 * milik pengguna (`anakOrRedirect`), karena sebagian dibaca dengan klien admin.
 */
export async function ringkasanSiswa(studentId: string): Promise<RingkasanSiswa> {
  const learnerId = await learnerAnak(studentId).catch(() => null)
  const misi = learnerId ? await kemajuanMisi(learnerId) : null

  let tryOut = 0
  try {
    const admin = createAdminClient()
    const { data: pelajar } = await admin.from('learners').select('id').eq('profile_id', studentId).maybeSingle()
    const id = (pelajar as { id: string } | null)?.id
    if (id) {
      const { data } = await admin
        .from('attempts')
        .select('quiz_id, quizzes!inner(kind)')
        .eq('learner_id', id)
        .not('submitted_at', 'is', null)
        .eq('quizzes.kind', 'tryout')
      tryOut = new Set(((data ?? []) as { quiz_id: string }[]).map((r) => r.quiz_id)).size
    }
  } catch {
    tryOut = 0
  }
  return { misi, tryOut }
}
