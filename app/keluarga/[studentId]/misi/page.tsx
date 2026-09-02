import { belajarContext } from '@/lib/belajar/konteks'
import { keadaanPaketTopik, petaTopik } from '@/lib/belajar/topik-peta'
import PetaTopik from '@/components/belajar/PetaTopik'

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
 * Jalur datanya: `petaTopik()` dari server, lalu keadaan paket yang terbentang
 * dijemput sendiri oleh `DaftarPaket` lewat `muatPaketPeta`.
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

  const peta = await petaTopik(learnerId)

  // Satu topik saja berarti ia terbentang sejak halaman dibuka, jadi isinya
  // ikut dibawa sekarang — aturan yang sama dengan `/belajar`.
  const paketAwal =
    peta.length === 1 ? await keadaanPaketTopik(learnerId, peta[0].id) : undefined

  return <PetaTopik anak={studentId} topik={peta} paketAwal={paketAwal} />
}