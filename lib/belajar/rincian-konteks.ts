import { createAdminClient } from '@/lib/supabase/server-admin'
import { learnerAnak } from '@/lib/belajar/sesi'

/**
 * Siapa yang membuka halaman rincian penguasaan, dan ke mana tautannya.
 *
 * Halaman rincian (`RincianGrup`, `RincianMisi`, `TinjauSoalIsi`) lahir di portal
 * keluarga. Admin memakai ISI yang sama di `/admin/rekap-penguasaan/[studentId]/…`
 * supaya angka dan soal yang ia lihat tidak bisa berbeda dari yang dilihat orang
 * tua. Yang berbeda hanya empat hal, dan semuanya lewat objek ini:
 *
 * - dari mana `learnerId` diambil (admin tidak lewat `practice_children()`);
 * - dasar alamat tautan rincian dan soal;
 * - tombol yang MEMULAI latihan (`/belajar?anak=`, `Buka di Misi`) tidak ada di
 *   admin — admin meninjau, tidak berlatih atas nama siswa;
 * - kunci jawaban selalu tampil bagi admin (ia tidak sedang diukur).
 *
 * `dari` menentukan menu asal (Latihan Mandiri atau Ketuntasan Materi), supaya
 * panah kembali jatuh di menu yang benar.
 */
export type KonteksRincian = {
  studentId: string
  admin?: { dari: 'mandiri' | 'misi' }
}

/** Hanya membaca — tidak melahirkan baris `learners`. */
export async function learnerRincian(k: KonteksRincian): Promise<string | null> {
  if (!k.admin) return learnerAnak(k.studentId)
  const { data } = await createAdminClient()
    .from('learners')
    .select('id')
    .eq('profile_id', k.studentId)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

/**
 * Dasar alamat rincian di panel admin. Tiap menu punya rutenya sendiri
 * (`/admin/rekap-penguasaan/…` untuk Latihan Mandiri, `/admin/misi/…` untuk
 * Ketuntasan Materi) supaya menu samping menyala di menu asal.
 */
export function dasarRincianAdmin(dari: 'mandiri' | 'misi', studentId: string): string {
  return `/admin/${dari === 'misi' ? 'misi' : 'rekap-penguasaan'}/${studentId}`
}

/** Alamat rincian satu topik (`kunci` = id grup atau kode topik peta). */
export function alamatRincian(k: KonteksRincian, kunci: string): string {
  return k.admin
    ? `${dasarRincianAdmin(k.admin.dari, k.studentId)}/${kunci}`
    : `/keluarga/${k.studentId}/penguasaan/${kunci}`
}

/** Alamat peninjauan satu soal dalam sebuah sesi. */
export function alamatSoal(k: KonteksRincian, kunci: string, sesiId: string, itemId: string): string {
  return k.admin
    ? `${dasarRincianAdmin(k.admin.dari, k.studentId)}/${kunci}/soal?sesi=${sesiId}&item=${itemId}`
    : `/keluarga/${k.studentId}/penguasaan/${kunci}/soal?sesi=${sesiId}&item=${itemId}`
}
