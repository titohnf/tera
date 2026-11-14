import { HTML_AC01 } from './ac01'

/**
 * Daftar materi interaktif, dikunci dengan kode topik Misi (`topik.id`, mis.
 * "AC-01"). Satu materi untuk satu topik: ia langkah "Belajar" sebelum paket
 * latihan topik itu, bukan pengganti bahan PDF di `curriculum_resources` (yang
 * berkunci `group_id` dan hidup di dunia Belajar, bukan Misi).
 *
 * Topik tanpa entri di sini tidak punya langkah Belajar; halaman topiknya tidak
 * menampilkannya, jadi menambah materi baru cukup menambah satu baris di bawah.
 */
export interface MateriInteraktif {
  kode: string
  judul: string
  ringkas: string
  html: string
}

const DAFTAR: MateriInteraktif[] = [
  {
    kode: 'AC-01',
    judul: 'Ikat Sepuluh',
    ringkas: 'Bilangan sampai 100 dengan ikat lidi',
    html: HTML_AC01,
  },
]

export const daftarMateriInteraktif = DAFTAR

export function materiInteraktif(kode: string): MateriInteraktif | null {
  const k = kode.trim().toUpperCase()
  return DAFTAR.find(m => m.kode === k) ?? null
}
