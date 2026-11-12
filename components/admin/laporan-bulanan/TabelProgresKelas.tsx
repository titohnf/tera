import { monthRange } from '@/lib/reports/laporan-bulanan'
import { ringkasanProgresKelas } from '@/lib/reports/progres-kelas-semua'
import { jenisSiswaBanyak } from '@/lib/reports/jenis-siswa'
import TabelSiswaUrut, { type BarisSiswa } from '@/components/admin/laporan-bulanan/TabelSiswaUrut'

/**
 * Progres Kelas semua siswa aktif untuk satu bulan atau seluruh waktu, satu
 * baris per siswa.
 *
 * Angkanya dari `ringkasanProgresKelas()`, yang aturannya sama dengan
 * `getLaporanBulananData()` (fungsi laporan satu siswa dan portal keluarga) dan
 * sudah diuji identik pada data nyata. Kolomnya jumlah dan rata-rata per mapel,
 * bukan satu angka gabungan: penyebut tiap mapel berlainan (lihat
 * `lib/reports/ringkasan-laporan.ts`).
 *
 * Kolom mapel adalah gabungan mapel yang punya nilai pada periode itu, diurut
 * dari mapel yang paling banyak siswanya bernilai. Pengurutan baris dikerjakan
 * di `TabelSiswaUrut`, di browser.
 *
 * Mengklik baris membuka laporan siswa itu untuk bulan terakhir ia punya sesi
 * pada periode tersebut — laporan satu siswa selalu per bulan.
 */
export default async function TabelProgresKelas({
  students,
  month,
  semuaWaktu,
  pemilihPeriode,
}: {
  students: { id: string; full_name: string | null; grade: string | null }[]
  month: string
  semuaWaktu: boolean
  /** Pemilih periode; ditampilkan satu baris dengan kolom pencarian. */
  pemilihPeriode: React.ReactNode
}) {
  const periode = semuaWaktu
    ? {}
    : (() => {
        const { startIso, endIso } = monthRange(month)
        return { startIso, endIso }
      })()

  const [ringkasan, jenisSiswa] = await Promise.all([
    ringkasanProgresKelas(
      students.map(s => s.id),
      periode,
    ),
    jenisSiswaBanyak(students.map(s => s.id)),
  ])

  const sekarang = new Date()
  const bulanIni = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}`

  const baris: BarisSiswa[] = students.map(s => {
    const r = ringkasan.get(s.id)!
    return {
      id: s.id,
      nama: s.full_name ?? '(tanpa nama)',
      // Kolom `profiles.grade` bertipe angka di database walau tipenya di kode
      // tertulis teks. Dijadikan teks di sini, supaya cocok dengan nilai pilihan
      // filter kelas (nilai <option> selalu teks).
      jenis: jenisSiswa.get(s.id) ?? 'bimbel',
      kelas: s.grade === null || s.grade === undefined ? null : String(s.grade),
      pct: r.pct,
      hadir: r.hadir,
      sesi: r.sesi,
      nilai: r.nilai,
      bulanDetail: r.bulanTerakhir ?? (semuaWaktu ? bulanIni : month),
    }
  })

  if (baris.length === 0) {
    return (
      <div className="space-y-3">
        {pemilihPeriode}
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center">
          <p className="text-sm text-gray-500">Belum ada siswa aktif.</p>
        </div>
      </div>
    )
  }

  // Mapel yang paling banyak siswanya bernilai di depan; yang seri urut abjad.
  const jumlahSiswa = new Map<string, number>()
  for (const b of baris) {
    for (const m of Object.keys(b.nilai)) jumlahSiswa.set(m, (jumlahSiswa.get(m) ?? 0) + 1)
  }
  const mapel = [...jumlahSiswa.keys()].sort(
    (a, b) => jumlahSiswa.get(b)! - jumlahSiswa.get(a)! || a.localeCompare(b, 'id'),
  )

  return <TabelSiswaUrut baris={baris} mapel={mapel} pemilihPeriode={pemilihPeriode} />
}
