import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { PaketRingkas } from '@/lib/belajar/langkah'
import { temaTopik, type TemaTopik } from '@/lib/belajar/tema-topik'

/**
 * Warna dan hitungan bintang untuk layar Misi anak.
 *
 * BERKAS TANPA IMPOR SERVER, sama seperti `tema-topik.ts`: komponen klien
 * memanggilnya, jadi tidak boleh serumah dengan pembaca database.
 *
 * EMPAT WARNA TEMA, SATU WARNA TUNTAS. Tiap tema punya warna sendiri supaya anak
 * mengenali "yang biru itu Bilangan" tanpa membaca. Emas dipegang tuntas, dan
 * merah dipegang keping yang gagal; keduanya tidak dipakai tema, supaya warna
 * yang sama tidak berarti dua hal.
 *
 * KONTRAS: `dasar` dipilih paling terang yang masih memberi rasio ≥ 4,5 terhadap teks putih (WCAG AA); kartu
 * berwarna tema memakai teks putih. `dasar` untuk isi, `tua` untuk "tebing" bawah tombol berdimensi, `muda` untuk
 * latar lembut, `teks` untuk huruf di atas `muda`.
 */
export interface GayaTema {
  /** Warna tema yang hidup (belum dituakan untuk kontras): hanya untuk pojok gradasi yang tidak memuat teks. */
  terang: string
  dasar: string
  tua: string
  muda: string
  teks: string
}

const GAYA: Record<TemaTopik, GayaTema> = {
  bilangan: { terang: '#4F8FFF', dasar: '#2F6FEA', tua: '#1E40AF', muda: '#DBEAFE', teks: '#1E3A8A' },
  aljabar: { terang: '#9B6FFF', dasar: '#7C3AED', tua: '#5B21B6', muda: '#EDE9FE', teks: '#4C1D95' },
  geometri_pengukuran: { terang: '#FF8A2B', dasar: '#C94A0A', tua: '#9A3412', muda: '#FFEDD5', teks: '#7C2D12' },
  data_peluang: { terang: '#FF5AA6', dasar: '#DB2777', tua: '#9D174D', muda: '#FCE7F3', teks: '#831843' },
  lainnya: { terang: '#22CDB8', dasar: '#0E8074', tua: '#115E59', muda: '#CCFBF1', teks: '#134E4A' },
}

export const EMAS = '#FBBF24'
export const EMAS_TUA = '#D97706'

export function gayaTema(elemen: string | null | undefined): GayaTema {
  return GAYA[temaTopik(elemen)]
}

/**
 * Bintang sebuah topik, 0–3. Tiap bintang punya arti sendiri:
 *   1. semua level wajib lolos,
 *   2. semua pengayaan lolos,
 *   3. ujian (Tantangan Akhir) sudah dikerjakan.
 *
 * Bintang pengayaan dan ujian hanya bisa didapat SETELAH bintang wajib: topik
 * yang tidak punya pengayaan (atau ujian) tidak boleh memberi bintang cuma-cuma
 * di awal, jadi bagian yang tidak ada dianggap selesai begitu level wajib selesai.
 * Topik berstatus tuntas (putusan sistem) selalu tiga.
 */
export function hitungBintang(t: TopikPeta, paket: PaketRingkas[]): 0 | 1 | 2 | 3 {
  if (t.status === 'tuntas') return 3
  const wajib = paket.filter(p => p.jenis === 'latihan' && !p.pengayaan)
  if (wajib.length === 0 || !wajib.every(p => p.lolos)) return 0
  const pengayaan = paket.filter(p => p.jenis === 'latihan' && p.pengayaan)
  const ujian = paket.filter(p => p.jenis === 'ujian')
  const b2 = pengayaan.every(p => p.lolos)
  const b3 = ujian.every(p => p.lolos)
  return (1 + (b2 ? 1 : 0) + (b3 ? 1 : 0)) as 1 | 2 | 3
}

/**
 * Level wajib sebuah topik: berapa yang sudah lolos dari berapa seluruhnya.
 * Dasar bintang DAN cincin kemajuan di simpul, jadi keduanya selalu cocok.
 */
export function hitungLevel(paket: PaketRingkas[]): { lolos: number; total: number } {
  const wajib = paket.filter(p => p.jenis === 'latihan' && !p.pengayaan)
  return { lolos: wajib.filter(p => p.lolos).length, total: wajib.length }
}

/**
 * Pangkat tiap kelas, nama checkpoint di rute "Ikuti urutan": naik kelas berarti
 * naik pangkat.
 *
 * BENTUKNYA tangga rank gim yang dikenal anak: tingkat besar, dan di dalamnya
 * sub-tingkat berupa kata kedua (Muda → Utama), lalu naik ke tingkat berikutnya. NAMANYA bahasa Indonesia dan urutan kemahiran baku (Pemula →
 * Pejuang → Elit → Mahir → Ahli → Pakar), bukan nama tingkat gim tertentu, supaya
 * tidak menjiplak milik siapa pun. Dua belas kelas dibagi: Pemula 2, Pejuang 2, Elit 2, Mahir 2, lalu Ahli, Pakar,
 * Maestro, Legenda masing-masing satu.
 *
 * Kelas di luar 1–12 (atau tanpa kelas) jatuh ke "Misi Bonus".
 */
const PANGKAT = [
  'Pemula Baru',
  'Pemula Berbakat',
  'Pejuang Muda',
  'Pejuang Utama',
  'Elit Muda',
  'Elit Utama',
  'Mahir Muda',
  'Mahir Utama',
  'Ahli',
  'Pakar',
  'Maestro',
  'Legenda',
]

export function pangkatKelas(kelas: number | null): string {
  return kelas != null && kelas >= 1 && kelas <= PANGKAT.length ? PANGKAT[kelas - 1] : 'Misi Bonus'
}
