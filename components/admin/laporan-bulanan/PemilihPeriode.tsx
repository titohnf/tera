'use client'

type Option = { value: string; label: string }

const SEMUA = 'semua'

/**
 * Pemilih periode Progres Kelas: satu bulan, atau seluruh waktu.
 *
 * "Semua waktu" hanya berlaku untuk tabel semua siswa; laporan satu siswa
 * selalu per bulan (catatan tambahan dan PDF-nya terikat pada satu bulan).
 * Karena itu memilihnya melepas siswa yang sedang dibuka, dan memilih bulan
 * melepas penanda "semua waktu".
 */
export default function PemilihPeriode({
  options,
  month,
  semua,
}: {
  options: Option[]
  /** Bulan terpilih (YYYY-MM). */
  month: string
  /** Tabel sedang menampilkan seluruh waktu. */
  semua: boolean
}) {
  return (
    <select
      value={semua ? SEMUA : month}
      onChange={e => {
        const url = new URL(window.location.href)
        if (e.target.value === SEMUA) {
          url.searchParams.set('periode', SEMUA)
          url.searchParams.delete('month')
          url.searchParams.delete('student_id')
        } else {
          url.searchParams.set('month', e.target.value)
          url.searchParams.delete('periode')
        }
        window.location.href = url.toString()
      }}
      className="pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map(m => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
      <option value={SEMUA}>Semua waktu</option>
    </select>
  )
}
