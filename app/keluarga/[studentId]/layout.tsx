import { redirect } from 'next/navigation'
import { keluargaContext } from '@/lib/keluarga'
import { notifikasiAnak } from '@/lib/keluarga-notifikasi'
import RangkaAnak from '@/components/keluarga/RangkaAnak'

/**
 * Rangka portal keluarga untuk satu anak: isi di tengah, navigasi di bawah.
 *
 * Pemilih anaknya tidak lagi di sini. Ia sempat jadi bilah tab tepat di bawah
 * header, dan kini sebuah tombol di pojok kanan header itu sendiri — dirakit
 * oleh `app/keluarga/layout.tsx`, satu tingkat di atas rangka ini. Alasannya
 * ditulis di `components/keluarga/PemilihAnak`.
 *
 * Bentuk aplikasi ponsel dipilih dengan sengaja. Portal ini nyaris tidak pernah
 * dibuka dari komputer, dan versi sebelumnya menaruh semua isinya di satu
 * halaman bertab yang meluber di layar 390px — Kelas, Tagihan, Laporan, Belajar
 * berjejalan dalam satu bilah yang harus digeser mendatar.
 *
 * Dipakai `keluargaContext()`, bukan `anakOrRedirect()`, karena yang diperiksa
 * di sini adalah apakah id di URL memang salah satu anak keluarga ini —
 * sementara `anakOrRedirect` sengaja menimpa `anak` dengan satu anak yang
 * sedang dibuka.
 *
 * Halaman-halaman di bawah rute ini tetap memanggil `anakOrRedirect` sendiri.
 * Panggilan itu murah dan tidak boleh dihilangkan: layout di Next tidak
 * dijalankan ulang saat berpindah antar halaman di bawahnya, jadi ia bukan
 * penjaga yang bisa diandalkan sendirian.
 *
 * Bilah bawahnya tidak muncul di semua halaman — `RangkaAnak` yang memilih,
 * dengan alasan yang ditulis di sana.
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
      <RangkaAnak studentId={ini.id} idNotifikasi={notifikasi.map((n) => n.id)}>
        {children}
      </RangkaAnak>
    </>
  )
}
