import { createClient } from '@/lib/supabase/server'
import { extractDriveFileId } from '@/lib/curriculum-resource-links'
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
 * Yang dipulangkan HANYA materi yang benar-benar bisa dibaca anak — yang PDF-nya
 * sudah ada di penyimpanan Tera, disajikan `/api/materi/[id]`. Sisanya tidak
 * disebut sama sekali, bukan disebut dengan tautan yang berakhir di layar "Anda
 * memerlukan akses" milik Google. Alasannya di dalam badan fungsi.
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
    .in('group_id', groupIds)
    .order('title')
  const materi = (data as MateriTopik[] | null) ?? []
  if (materi.length === 0) return []

  const idBerkas = [...new Set(
    materi.map((m) => extractDriveFileId(m.link_url)).filter((v): v is string => !!v),
  )]
  if (idBerkas.length === 0) return []

  const { data: salinan } = await supabase
    .from('curriculum_resource_duplications')
    .select('drive_file_id, pdf_path')
    .in('drive_file_id', idBerkas)
  const pdfById = new Map(
    ((salinan as Baris[] | null) ?? [])
      .filter((s) => s.pdf_path)
      .map((s) => [s.drive_file_id, s.pdf_path as string]),
  )

  // Yang tidak bisa dibaca TIDAK dibawa sama sekali.
  //
  // Sebelumnya baris tanpa PDF tetap dipulangkan, jatuh ke salinan Drive atau
  // ke berkas sumber tutornya — "keadaan yang sebenarnya", begitu alasannya.
  // Tapi yang sampai ke anak bukan keadaan yang sebenarnya melainkan layar
  // "Anda memerlukan akses" milik Google, dan sebuah angka yang menjanjikan
  // bahan yang tidak bisa ia buka. Menghitungnya sebagai materi membuat
  // halaman ini berbohong dua kali: di angkanya, dan di tautannya.
  //
  // Jadi ukurannya satu — ada PDF-nya di penyimpanan Tera atau tidak. Materi
  // yang belum dikonversi tetap ada di katalog dan tetap terlihat admin
  // sebagai pekerjaan; ia cuma belum pernah disebut kepada anak.
  return materi
    .filter((m) => {
      const fileId = extractDriveFileId(m.link_url)
      return !!fileId && pdfById.has(fileId)
    })
    .map((m) => ({ ...m, link_url: `/api/materi/${m.id}` }))
}

type Baris = { drive_file_id: string; pdf_path: string | null }
