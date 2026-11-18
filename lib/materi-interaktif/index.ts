import { HTML_AC01 } from './ac01'
import { HTML_AC02 } from './ac02'
import { HTML_AC03 } from './ac03'
import { HTML_AC04 } from './ac04'
import { HTML_AC05 } from './ac05'
import { HTML_AC06 } from './ac06'
import { HTML_AC07 } from './ac07'
import { HTML_AC08 } from './ac08'
import { HTML_AC09 } from './ac09'
import { HTML_AC10 } from './ac10'
import { HTML_AC11 } from './ac11'

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
  {
    kode: 'AC-02',
    judul: 'Cari Bentuk',
    ringkas: 'Bangun datar, bangun ruang, dan letak benda',
    html: HTML_AC02,
  },
  {
    kode: 'AC-03',
    judul: 'Lompat Katak',
    ringkas: 'Tambah dan kurang sampai 20 di garis bilangan',
    html: HTML_AC03,
  },
  {
    kode: 'AC-04',
    judul: 'Ikuti Pola',
    ringkas: 'Pola gambar, warna, dan bunyi',
    html: HTML_AC04,
  },
  {
    kode: 'AC-05',
    judul: 'Bagi Adil',
    ringkas: 'Setengah dan seperempat dengan bentuk yang dibelah',
    html: HTML_AC05,
  },
  {
    kode: 'AC-06',
    judul: 'Siapa Lebih?',
    ringkas: 'Bandingkan panjang, berat, dan lama dengan satuan tidak baku',
    html: HTML_AC06,
  },
  {
    kode: 'AC-07',
    judul: 'Pilah dan Hitung',
    ringkas: 'Memilah, mengurutkan, dan membaca piktogram',
    html: HTML_AC07,
  },
  {
    kode: 'AC-08',
    judul: 'Bilangan Ribuan',
    ringkas: 'Bilangan sampai 10.000: nilai tempat, baca-tulis, bandingkan',
    html: HTML_AC08,
  },
  {
    kode: 'AC-09',
    judul: 'Susun dan Hitung',
    ringkas: 'Tambah-kurang sampai 1.000: menyimpan, meminjam, memeriksa',
    html: HTML_AC09,
  },
  {
    kode: 'AC-10',
    judul: 'Kali dan Bagi',
    ringkas: 'Kali, bagi, sisa, dan hubungan keduanya',
    html: HTML_AC10,
  },
  {
    kode: 'AC-11',
    judul: 'Si Kotak Misterius',
    ringkas: 'Mencari bilangan yang belum diketahui dengan timbangan',
    html: HTML_AC11,
  },
]

export const daftarMateriInteraktif = DAFTAR

export function materiInteraktif(kode: string): MateriInteraktif | null {
  const k = kode.trim().toUpperCase()
  return DAFTAR.find(m => m.kode === k) ?? null
}
