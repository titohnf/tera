import { cookies } from 'next/headers'
import { COOKIE_DARI } from '@/lib/belajar/cookie-dari'

/**
 * Tampilan tempat seorang anak bimbel sedang berada: 'siswa' (masuk dengan kode, `/siswa/<anak>`)
 * atau tampilan keluarga (tanpa nilai, `/keluarga/<anak>`).
 *
 * Latihan Soal, Misi, dan Materi dibangun dulu untuk portal keluarga, jadi alamat dan tombol
 * kembalinya menuju `/keluarga/<anak>`. Halaman di bawah `/siswa/...` membawa `dari="siswa"`
 * secara eksplisit; halaman di bawah `/belajar` (sesi latihan, hasil) tidak punya tempat
 * menaruhnya di alamat, jadi membaca cookie `tera_dari` yang dipasang `proxy.ts` setiap kali
 * orang membuka `/siswa/...` (atau `/keluarga/...`, yang menggantinya kembali).
 */
export type Dari = 'siswa'

export async function dariSaatIni(): Promise<Dari | undefined> {
  return (await cookies()).get(COOKIE_DARI)?.value === 'siswa' ? 'siswa' : undefined
}
