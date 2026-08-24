import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { namaPendek } from '@/lib/nama'

/**
 * Konteks pelanggan langganan: akun yang login dan produk yang boleh dipakainya.
 *
 * Cermin sengaja dari `keluargaContext()` di `lib/keluarga.ts`, termasuk
 * alasannya: memakai client sesi biasa, BUKAN createAdminClient(). Alasan itu
 * berlaku lebih kuat di sini, bukan lebih lemah. Portal keluarga dibuka orang
 * luar organisasi yang setidaknya kita kenal namanya; halaman ini dibuka siapa
 * pun yang mendaftar sendiri. Kalau ada policy yang keliru, halamannya kosong
 * dan itu ketahuan; dengan service key, kekeliruan yang sama membocorkan data
 * tanpa jejak.
 *
 * Hak pakainya dibaca lewat `has_product()` (migrasi 109), yang memeriksa
 * jendela tanggal langganan — bukan kolom `status`-nya. Jadi langganan yang
 * kedaluwarsa berhenti berlaku pada detik yang tepat, tanpa bergantung pada
 * proses apa pun yang harus berjalan tepat waktu.
 *
 * Tidak ada anak di sini, dan itu perbedaan pokoknya dengan portal keluarga:
 * satu akun langganan adalah satu orang.
 */
export interface KonteksMandiri {
  user: { id: string; email?: string }
  nama: string
  namaPendek: string
  produk: { sora: boolean; gama: boolean }
}

export async function mandiriContext(): Promise<KonteksMandiri> {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'mandiri') redirect('/unauthorized')

  // Dua panggilan, bukan satu yang mengembalikan daftar: `has_product` sudah
  // jadi satu-satunya penjaga hak pakai di sisi database, dan menambah fungsi
  // kedua yang menjawab hal sama berarti dua tempat yang bisa menyimpang.
  const [{ data: sora }, { data: gama }] = await Promise.all([
    supabase.rpc('has_product', { p_product: 'sora' }),
    supabase.rpc('has_product', { p_product: 'gama' }),
  ])

  const nama = (profile.full_name as string) || (user.email ?? 'Kamu')

  return {
    user: { id: user.id, email: user.email },
    nama,
    namaPendek: namaPendek({ full_name: nama, nickname: profile.nickname as string | null }),
    produk: { sora: sora === true, gama: gama === true },
  }
}
