'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Tutor menandai sebuah eskalasi sudah direspons (FR7).
 *
 * Tipis dengan sengaja, alasan yang sama dengan aksi permukaan belajar: id
 * eskalasi datang dari browser dan TIDAK dipercaya di sini — `eskalasi_jawab()`
 * (150) yang memeriksa apakah pemanggilnya memang penanggung jawab murid itu,
 * dan stempel waktunya diambil dari jam server, bukan dari jam pengirim.
 */
export async function jawabEskalasi(id: string, catatan: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('eskalasi_jawab', {
    p_id: id,
    p_catatan: catatan,
  })

  if (error) {
    console.error('[pengukuran] gagal menjawab eskalasi:', error)
    return false
  }

  revalidatePath('/tutor/pengukuran')
  return data === true
}
