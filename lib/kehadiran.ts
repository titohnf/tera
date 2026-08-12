/**
 * Kehadiran: label statusnya dan cara menghitung persentasenya.
 *
 * Diangkat dari `components/siswa/JadwalTable.tsx`, tempat keduanya dulu
 * tinggal, begitu portal keluarga ikut menampilkan riwayat sesi. Halaman admin
 * dan halaman keluarga sekarang menjawab pertanyaan yang sama — "anak ini hadir
 * berapa kali" — dan jawabannya harus datang dari satu tempat: selisih angka di
 * dua layar yang sama-sama dilihat orang tua dan admin adalah percakapan yang
 * tidak perlu.
 */

// Absen memakai abu yang lebih pekat daripada Izin: keduanya status kehadiran
// dan bisa berdiri di tabel yang sama, jadi warnanya tidak boleh persis sama.
// Merah disisakan untuk "Dibatalkan", yang bukan tentang anaknya sama sekali.
export const KEHADIRAN: Record<string, { label: string; cls: string }> = {
  present: { label: 'Hadir',     cls: 'bg-green-100 text-green-700' },
  late:    { label: 'Terlambat', cls: 'bg-yellow-100 text-yellow-700' },
  absent:  { label: 'Absen',     cls: 'bg-slate-200 text-slate-600' },
  excused: { label: 'Izin',      cls: 'bg-gray-100 text-gray-500' },
}

/** Terlambat tetap dihitung hadir — anaknya datang, dan sesinya berjalan. */
export function sudahHadir(status: string | undefined): boolean {
  return status === 'present' || status === 'late'
}

/**
 * Rekap kehadiran atas sesi yang BENAR-BENAR terlaksana.
 *
 * Sesi terjadwal yang belum berjalan dan sesi yang dibatalkan tidak masuk
 * penyebut: memasukkannya membuat persentase anak baru terlihat buruk hanya
 * karena jadwalnya masih panjang ke depan. `persen` bernilai null kalau belum
 * ada sesi terlaksana sama sekali — bukan 0%, yang terbaca seolah tidak pernah
 * hadir.
 */
export function hitungKehadiran(
  sesi: { id: string; status: string }[],
  hadirPerSesi: Map<string, string>,
): { total: number; hadir: number; persen: number | null } {
  const terlaksana = sesi.filter((s) => s.status === 'completed')
  const hadir = terlaksana.filter((s) => sudahHadir(hadirPerSesi.get(s.id))).length
  return {
    total: terlaksana.length,
    hadir,
    persen: terlaksana.length > 0 ? Math.round((hadir / terlaksana.length) * 100) : null,
  }
}

/**
 * Warna sorot untuk baris sesi yang sedang dibuka.
 *
 * Mengikuti chip di kolom Keterangan, supaya baris terbuka tidak cuma berarti
 * "ini yang sedang kamu lihat" tapi sekaligus mengulang statusnya — mata sudah
 * terlanjur belajar bahwa merah itu batal dan hijau itu hadir. Sesi yang belum
 * punya keterangan memakai biru: netral, dan tidak menyiratkan penilaian apa pun
 * atas sesi yang memang belum terjadi.
 *
 * Kelasnya ditulis utuh, bukan dirakit dari potongan (`border-${warna}-200`),
 * karena Tailwind memindai kode sebagai teks — nama kelas yang dirangkai saat
 * berjalan tidak pernah ikut tergenerate.
 */
export type SorotBaris = { baris: string; garis: string; panel: string }

const SOROT: Record<string, SorotBaris> = {
  present: {
    baris: 'bg-green-50 [&>td]:border-t-green-200 border-b-green-200 [&>td:last-child]:border-r-green-200',
    garis: 'border-l-green-500',
    panel: 'border-l-green-500 border-t-green-200 border-b-green-200 border-r-green-200',
  },
  late: {
    baris: 'bg-yellow-50 [&>td]:border-t-yellow-200 border-b-yellow-200 [&>td:last-child]:border-r-yellow-200',
    garis: 'border-l-yellow-500',
    panel: 'border-l-yellow-500 border-t-yellow-200 border-b-yellow-200 border-r-yellow-200',
  },
  absent: {
    baris: 'bg-slate-50 [&>td]:border-t-slate-300 border-b-slate-300 [&>td:last-child]:border-r-slate-300',
    garis: 'border-l-slate-400',
    panel: 'border-l-slate-400 border-t-slate-300 border-b-slate-300 border-r-slate-300',
  },
  excused: {
    baris: 'bg-gray-50 [&>td]:border-t-gray-200 border-b-gray-200 [&>td:last-child]:border-r-gray-200',
    garis: 'border-l-gray-400',
    panel: 'border-l-gray-400 border-t-gray-200 border-b-gray-200 border-r-gray-200',
  },
  cancelled: {
    baris: 'bg-red-50 [&>td]:border-t-red-200 border-b-red-200 [&>td:last-child]:border-r-red-200',
    garis: 'border-l-red-500',
    panel: 'border-l-red-500 border-t-red-200 border-b-red-200 border-r-red-200',
  },
  kosong: {
    baris: 'bg-blue-50 [&>td]:border-t-blue-200 border-b-blue-200 [&>td:last-child]:border-r-blue-200',
    garis: 'border-l-blue-500',
    panel: 'border-l-blue-500 border-t-blue-200 border-b-blue-200 border-r-blue-200',
  },
}

/** Status sesi menang atas kehadiran: sesi batal tidak punya kehadiran. */
export function sorotBaris(statusSesi: string, kehadiran: string | undefined): SorotBaris {
  if (statusSesi === 'cancelled') return SOROT.cancelled
  return (kehadiran && SOROT[kehadiran]) || SOROT.kosong
}
