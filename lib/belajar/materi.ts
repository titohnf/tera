import { createClient } from '@/lib/supabase/server'
import type { MateriTopik } from '@/lib/belajar/sematan'

/**
 * Materi milik sekumpulan topik.
 *
 * Memakai client sesi seperti seluruh permukaan belajar, jadi RLS yang
 * memutuskan siapa melihat apa: `curriculum_resources` hanya terbuka untuk
 * `is_admin()` (057) dan `is_family()` (076). Pelanggan langganan tidak punya
 * kebijakan sama sekali di tabel ini — dan itu kebetulan yang benar, karena
 * materi adalah bahan internal bimbel, bukan bagian dari langganan. Yang
 * memanggil tetap melewati fungsi ini saat `hanyaPublik`, supaya keputusan itu
 * terbaca di kode dan bukan cuma tersirat dari daftar yang selalu pulang kosong.
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
  return (data as MateriTopik[] | null) ?? []
}
