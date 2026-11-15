import { createAdminClient } from '@/lib/supabase/server-admin'
import { MISI } from '@/lib/curriculum-config'

/**
 * Menyamakan asesmen ujian Misi sebuah sesi dengan topiknya dan hasil ujian
 * siswa (fungsi database `sinkron_ujian_misi`, migrasi 217).
 *
 * Dipanggil sesudah topik sesi disimpan, dan setiap jurnal dibuka oleh yang
 * berhak mengubahnya, supaya nilai ujian yang baru dikerjakan siswa ikut
 * terbaca. Idempoten dan murah. Galatnya tidak boleh menjatuhkan halaman:
 * paling buruk jurnal menampilkan asesmen sebagaimana adanya.
 */
export async function sinkronUjianMisi(sessionId: string): Promise<void> {
  const { error } = await createAdminClient().rpc('sinkron_ujian_misi', { p_session: sessionId })
  if (error) console.error('[misi] gagal menyinkronkan asesmen ujian:', error)
}

/**
 * Kode topik Misi per grup topik kurikulum, dibaca dari baris `curriculum_topics`
 * yang sudah dimuat halaman (kolom `curriculum` dan `topic`, yang bentuknya
 * "AC-01 · nama" — migrasi 214). Dipakai layar untuk mengenali kartu Misi;
 * aturan kelengkapan di server memakai `curriculum_topic_groups.topik_id`.
 */
export function kodeMisiPerGrup(
  baris: { group_id?: string | null; curriculum?: string; topic: string | null }[],
): Record<string, string> {
  const hasil: Record<string, string> = {}
  for (const r of baris) {
    if (r.curriculum !== MISI || !r.group_id || !r.topic) continue
    const kode = r.topic.split(' · ')[0]
    if (/^[A-F]{1,2}-\d{2}$/.test(kode)) hasil[r.group_id] = kode
  }
  return hasil
}
