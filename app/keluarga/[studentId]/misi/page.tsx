import { belajarContext } from '@/lib/belajar/konteks'
import { petaTopik } from '@/lib/belajar/topik-peta'
import { langkahSeluruhTopik } from '@/lib/belajar/langkah'
import PetaTopik from '@/components/belajar/PetaTopik'
import KartuRetest from '@/components/belajar/KartuRetest'
import SapaanKunjungan from '@/components/belajar/SapaanKunjungan'
import { retestJatuhTempo } from '@/lib/belajar/retest'
import { catatKunjungan, sapaanKunjungan } from '@/lib/belajar/kunjungan'

/**
 * Misi: peta kompetensi per topik pengukuran, satu-satunya rumahnya.
 *
 * Layar ini sempat jadi bagian atas `/belajar`. Sejak ia pindah ke sini,
 * `/belajar` hanya merender `PemilihLatihan` — jadi tidak ada lagi tempat
 * kedua yang menampilkan peta, dan komentar lama yang menyebut "bagian yang
 * sama dengan `/belajar`" sudah tidak benar.
 *
 * Misi dan Belajar bukan dua tampilan dari hal yang sama, melainkan dua
 * entitas. Belajar menyusun dunia menurut BAB kurikulum bimbel dan berkunci
 * `curriculum_topic_groups`; Misi menyusunnya menurut APA YANG DIUKUR dan
 * berkunci `topik`. Migrasi 148 memisahkan butirnya dengan trigger — sebuah
 * butir ber-`topik_id` tidak boleh punya tag kurikulum sama sekali. Keduanya
 * berdampingan permanen; jangan satukan.
 *
 * Jalur datanya: `petaTopik()` dan `langkahSeluruhTopik()` dari server. Daftar
 * paketnya TIDAK lagi ada di sini — sejak migrasi 190 ia tinggal di halaman
 * topik (`misi/[topikId]`), dan barisnya di sini cuma pintu menuju langkah
 * berikutnya.
 *
 * MEMBUAT BARIS `learners`, dan itu disengaja. `belajarContext()` memanggil
 * `practice_start_as_child`, yang melahirkan baris `learners` kalau belum ada
 * (lihat `lib/belajar/konteks.ts`). Halaman Penguasaan sengaja menghindarinya
 * dan memakai `learnerAnak()`, karena laporan tidak berhak melahirkan apa pun.
 * Di sini boleh: ini permukaan tempat latihan DIMULAI, dan sejak Misi masuk
 * bilah bawah barisnya lahir saat tabnya diketuk alih-alih saat paket dibuka.
 * Yang lahir cuma baris identitas pelajar, bukan sesi maupun jawaban.
 *
 * `anak` yang diteruskan ke bawah adalah `studentId` — persis `?anak=` yang
 * dipakai permukaan belajar, dan `belajarContext` yang memeriksa anak ini
 * benar milik keluarga yang sedang masuk.
 */
export default async function PaketTopikPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { learnerId } = await belajarContext(studentId)

  // `catatKunjungan` MENULIS, jadi ia berdiri sendiri dan hanya di sini:
  // halaman inilah permukaan tempat anak mendarat (FR12). Memanggilnya dari
  // layar rapor orang tua akan membuat kunjungan orang tua terhitung sebagai
  // kunjungan anaknya, dan sapaan "sudah seminggu" tidak pernah muncul untuk
  // anak yang memang belum datang seminggu.
  const hariSejakKunjungan = await catatKunjungan(learnerId)
  const sapaan = sapaanKunjungan(hariSejakKunjungan)

  const [peta, retest, langkah] = await Promise.all([
    petaTopik(learnerId),
    retestJatuhTempo(learnerId),
    langkahSeluruhTopik(learnerId),
  ])

  return (
    <div className="space-y-4">
      {/* Di ATAS petanya, bukan di bawah: yang jatuh tempo adalah satu-satunya
          hal di layar ini yang punya waktunya sendiri, dan menaruhnya sesudah
          daftar topik berarti ia ditemukan oleh anak yang sudah selesai memilih
          hal lain. */}
      {/* Sapaan lebih dulu dari apa pun yang menuntut keputusan: yang baru
          kembali sesudah dua minggu perlu dibaca dulu bahwa kembalinya
          disambut, bukan langsung disodori daftar yang harus dipilih. */}
      {sapaan && <SapaanKunjungan sapaan={sapaan} anak={studentId} />}
      <KartuRetest retest={retest} anak={studentId} />
      <PetaTopik anak={studentId} topik={peta} langkah={langkah} />
    </div>
  )
}