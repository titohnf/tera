import { redirect } from 'next/navigation'
import { keluargaContext } from '@/lib/keluarga'
import { notifikasiAnak } from '@/lib/keluarga-notifikasi'
import AnakTabs from '@/components/keluarga/AnakTabs'
import BottomNav from '@/components/keluarga/BottomNav'

/**
 * Rangka portal keluarga untuk satu anak: pemilih anak di atas, isi di tengah,
 * navigasi di bawah.
 *
 * Bentuk aplikasi ponsel dipilih dengan sengaja. Portal ini nyaris tidak pernah
 * dibuka dari komputer, dan versi sebelumnya menaruh semua isinya di satu
 * halaman bertab yang meluber di layar 390px — Kelas, Tagihan, Laporan, Belajar
 * berjejalan dalam satu bilah yang harus digeser mendatar.
 *
 * Dipakai `keluargaContext()`, bukan `anakOrRedirect()`, karena bilah pemilih
 * memerlukan SELURUH daftar anak — sementara `anakOrRedirect` sengaja menimpa
 * `anak` dengan satu anak yang sedang dibuka.
 *
 * Halaman-halaman di bawah rute ini tetap memanggil `anakOrRedirect` sendiri.
 * Panggilan itu murah dan tidak boleh dihilangkan: layout di Next tidak
 * dijalankan ulang saat berpindah antar halaman di bawahnya, jadi ia bukan
 * penjaga yang bisa diandalkan sendirian.
 *
 * Notifikasinya dirakit di SINI, bukan di halaman notifikasi saja, karena
 * lencana di bilah bawah harus terlihat dari halaman mana pun — kalau angkanya
 * baru muncul sesudah loncengnya dibuka, ia tidak pernah jadi alasan untuk
 * membukanya. Harganya empat kueri per muat halaman portal; `notifikasiAnak`
 * di-`cache()` sehingga halaman notifikasi ikut memakai hasil yang sama, bukan
 * mengulang kuerinya.
 *
 * Yang diturunkan cuma DAFTAR ID, bukan angka jadi. Mana yang belum dibaca
 * tersimpan di localStorage perangkat masing-masing (lihat `lib/notif-terbaca`),
 * jadi server tidak bisa menghitungnya — dan tidak boleh berpura-pura bisa.
 */
export default async function AnakLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await keluargaContext()
  const ini = anak.find((a) => a.id === studentId)
  if (!ini) redirect('/keluarga')

  const { items: notifikasi } = await notifikasiAnak(ini.id)

  return (
    <>
      {/* Bilah pemilih hanya berguna kalau memang ada yang bisa dipilih. */}
      {anak.length > 1 && <AnakTabs anak={anak} aktif={ini.id} />}

      {/* `pb-20` menyisakan ruang untuk bilah navigasi yang melayang di dasar
          layar; tanpa itu kartu terakhir tertutup olehnya. */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">{children}</main>

      <BottomNav studentId={ini.id} idNotifikasi={notifikasi.map((n) => n.id)} />
    </>
  )
}
