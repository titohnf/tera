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
 * Tautan yang dikembalikan adalah SALINAN di Drive TERA kalau berkasnya sudah
 * pernah disalin ke sana (migrasi 117), bukan berkas sumber milik tutor.
 * Bedanya bukan kerapian: berkas sumber tersebar di Drive macam-macam orang dan
 * kebanyakan tidak dibagikan, jadi yang dilihat anak di dalam bingkainya adalah
 * layar "Anda memerlukan akses" — kegagalan yang tidak menghasilkan error apa
 * pun yang bisa kita tangkap. Salinan di folder bimbel adalah satu-satunya
 * berkas yang aksesnya benar-benar bisa kita atur sendiri.
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
  if (idBerkas.length === 0) return materi

  // Baris tanpa `copy_link` maupun `pdf_path` tetap dibawa: yang menentukan
  // bukan ada-tidaknya baris, melainkan kolom mana yang terisi. Materi yang
  // belum punya keduanya jatuh ke tautan sumbernya — keadaan yang sebenarnya,
  // dan menyembunyikannya tidak membuat berkasnya lebih bisa dibuka.
  const { data: salinan } = await supabase
    .from('curriculum_resource_duplications')
    .select('drive_file_id, copy_link, pdf_path')
    .in('drive_file_id', idBerkas)
  const byFileId = new Map(
    ((salinan as Baris[] | null) ?? []).map((s) => [s.drive_file_id, s]),
  )
  if (byFileId.size === 0) return materi

  return materi.map((m) => {
    const fileId = extractDriveFileId(m.link_url)
    const s = fileId ? byFileId.get(fileId) : undefined
    if (!s) return m
    // Urutannya menaik: berkas di penyimpanan Tera, lalu salinan Drive, lalu
    // berkas sumber apa adanya. Yang pertama satu-satunya yang benar-benar
    // dijaga identitas Tera; dua sisanya dijaga Google, dan itulah kenapa
    // keduanya cuma tempat berhenti sementara.
    if (s.pdf_path) return { ...m, link_url: `/api/materi/${m.id}` }
    return s.copy_link ? { ...m, link_url: s.copy_link } : m
  })
}

type Baris = { drive_file_id: string; copy_link: string | null; pdf_path: string | null }
