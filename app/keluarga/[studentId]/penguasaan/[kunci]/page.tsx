import { anakOrRedirect } from '@/lib/keluarga'
import { adalahKodeTopik } from '@/lib/belajar/topik-rapor'
import RincianGrup from './RincianGrup'
import RincianMisi from './RincianMisi'

/**
 * Perute rincian penguasaan: dua lapisan, satu alamat.
 *
 * `[kunci]` sengaja tidak bernama `[groupId]` lagi. Sejak jalur peta punya
 * laporannya sendiri, segmen ini memuat DUA jenis kunci — id grup kurikulum
 * yang berbentuk uuid, dan kode topik peta seperti `D-01`. Membedakannya bukan
 * tebakan: `topik.id` dijaga `check (id ~ '^[A-F]{1,2}-[0-9]{2}$')` sejak
 * migrasi 140, dan uuid tidak pernah cocok pola itu.
 *
 * KENAPA SATU SEGMEN, BUKAN `penguasaan/topik/[topikId]`. `HeaderKeluarga`
 * memilih judul dan panah kembali menurut KEDALAMAN path, bukan isinya. Rute
 * bersegmen tambahan akan membuat rincian topik berjudul "Soal" dengan panah
 * kembali ke `/penguasaan/topik` — alamat yang tidak ada. Dengan segmen yang
 * dipakai bersama, header tidak perlu disentuh sama sekali: kedalaman 3 tetap
 * "Rincian Topik", kedalaman 4 tetap "Soal", dan keduanya sudah kalimat yang
 * benar untuk kedua lapisan.
 *
 * `anakOrRedirect` dipanggil DI SINI, sekali, sebelum memilih badan — bukan di
 * masing-masing badan, tempat ia bisa terlewat saat salah satunya disalin.
 */
export default async function RincianPenguasaan({
  params,
}: {
  params: Promise<{ studentId: string; kunci: string }>
}) {
  const { studentId, kunci } = await params
  await anakOrRedirect(studentId)

  return adalahKodeTopik(kunci) ? (
    <RincianMisi studentId={studentId} topikId={kunci} />
  ) : (
    <RincianGrup studentId={studentId} groupId={kunci} />
  )
}
