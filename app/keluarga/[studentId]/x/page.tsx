import { belajarContext } from '@/lib/belajar/konteks'
import { keadaanPaketTopik, petaTopik } from '@/lib/belajar/topik-peta'
import PetaTopik from '@/components/belajar/PetaTopik'

/**
 * Segmen paket topik dari permukaan belajar, sebagai layar portal keluarga.
 *
 * Tempat ini membawa bagian yang sama dengan yang ditampilkan `/belajar`
 * sebelah pemilihan mapel — peta kompetensi per topik, lengkap dengan paketnya.
 * Karena itu komponennya dipakai ulang utuh (lihat `PemilihLatihan`), dan
 * jalur datanya pun sama: `petaTopik()` dari server, lalu keadaan paket yang
 * terbentang dijemput sendiri oleh `DaftarPaket` lewat `muatPaketPeta`.
 *
 * `anak` yang diteruskan ke bawah adalah `studentId` — persis `?anak=` yang
 * dipakai tautan "Latihan" di bilah navigasi, dan `belajarContext` yang
 * memeriksa anak ini benar milik keluarga yang sedang masuk.
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