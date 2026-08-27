import { createClient } from '@/lib/supabase/server'
import type { MateriTopik } from '@/lib/belajar/sematan'

/**
 * Materi milik sekumpulan topik.
 *
 * Memakai client sesi seperti seluruh permukaan belajar, jadi RLS yang
 * memutuskan siapa melihat apa: `curriculum_resources` terbuka untuk
 * `is_admin()` (057), `is_family()` (076), dan — sejak 119 — pemegang langganan
 * SORA yang aktif, tapi bagi yang terakhir HANYA baris `kind = 'materi'`.
 * `latihan_soal` di tabel yang sama adalah bahan penyusun soal dan bisa memuat
 * kunci jawaban; fungsi ini menyaringnya juga di query, dan dua lapis itu
 * disengaja — yang di sini menjelaskan maksudnya, yang di RLS menegakkannya.
 *
 * Yang dipulangkan HANYA yang `readable_at`-nya terisi — materi yang sudah
 * DIPASTIKAN bisa diambil dan ditampilkan, oleh `scripts/pindai-materi-drive.mjs`
 * (migrasi 127). Sisanya tidak disebut sama sekali, bukan disebut dengan tautan
 * yang berakhir di layar "Anda memerlukan akses" milik Google: sebuah angka yang
 * menjanjikan bahan yang tidak bisa dibuka membuat halaman ini berbohong dua
 * kali, di angkanya dan di tautannya.
 *
 * Ukuran itu dulu "ada PDF-nya di bucket". Diganti karena bucket akan
 * dikosongkan begitu materi sepenuhnya dilayani dari folder Drive bimbel — dan
 * ukuran yang menunjuk tempat penyimpanan ikut mati bersama tempat itu.
 * `readable_at` menunjuk keadaan, bukan tempat.
 *
 * Karena itu fungsi ini juga yang menentukan ANGKANYA: berapa materi sebuah
 * topik, menurut halaman belajar, adalah berapa yang bisa dibuka — bukan berapa
 * yang tercatat di katalog. `mapelLatihan()` memakai ukuran yang sama supaya
 * kartu mapel dan isi topiknya tidak pernah menyebut dua angka berbeda.
 */
export async function materiTopik(groupIds: string[]): Promise<MateriTopik[]> {
  if (groupIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('curriculum_resources')
    .select('id, group_id, title, link_url')
    .eq('kind', 'materi')
    .not('readable_at', 'is', null)
    .in('group_id', groupIds)
    .order('title')
  // Tautannya TIDAK dipakai di sini, dan itu disengaja: yang dibuka anak selalu
  // `/api/materi/[id]`, yang memeriksa haknya lebih dulu lalu memutuskan sendiri
  // dari mana byte-nya diambil. Halaman ini tidak perlu tahu berkasnya sedang
  // duduk di Drive atau di bucket, dan tidak boleh jadi tempat kedua yang harus
  // ikut diubah setiap kali jawabannya bergeser.
  return ((data as MateriTopik[] | null) ?? []).map((m) => ({
    ...m,
    link_url: `/api/materi/${m.id}`,
  }))
}
