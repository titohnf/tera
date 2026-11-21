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
import { HTML_AC12 } from './ac12'
import { HTML_AC13 } from './ac13'
import { HTML_AC14 } from './ac14'
import { HTML_AC15 } from './ac15'
import { HTML_AC16 } from './ac16'
import { HTML_AC17 } from './ac17'
import { HTML_AC18 } from './ac18'
import { HTML_AC19 } from './ac19'
import { HTML_AC20 } from './ac20'
import { HTML_AC21 } from './ac21'
import { HTML_AC22 } from './ac22'
import { HTML_AC23 } from './ac23'
import { HTML_AC24 } from './ac24'
import { HTML_AC25 } from './ac25'
import { HTML_AC26 } from './ac26'
import { HTML_AC27 } from './ac27'
import { HTML_AC28 } from './ac28'
import { HTML_AC29 } from './ac29'
import { HTML_AC30 } from './ac30'
import { HTML_AC31 } from './ac31'
import { HTML_D01 } from './d01'
import { HTML_D02 } from './d02'
import { HTML_D03 } from './d03'
import { HTML_D04 } from './d04'
import { HTML_D05 } from './d05'
import { HTML_D06 } from './d06'
import { HTML_D07 } from './d07'
import { HTML_D08 } from './d08'
import { HTML_D09 } from './d09'
import { HTML_D10 } from './d10'
import { HTML_D11 } from './d11'
import { HTML_D12 } from './d12'
import { HTML_D13 } from './d13'
import { HTML_D14 } from './d14'
import { HTML_D15 } from './d15'
import { HTML_D16 } from './d16'

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
  {
    kode: 'AC-12',
    judul: 'Pola Ajaib',
    ringkas: 'Pola gambar dan bilangan: kelompok, selisih, suku ke-n',
    html: HTML_AC12,
  },
  {
    kode: 'AC-13',
    judul: 'Detektif Bentuk',
    ringkas: 'Ciri bangun datar dan ruang, jaring-jaring, dan tampak',
    html: HTML_AC13,
  },
  {
    kode: 'AC-14',
    judul: 'Arsitek Kubus',
    ringkas: 'Menyusun, memotong, menggabungkan, dan memutar bangun ruang',
    html: HTML_AC14,
  },
  {
    kode: 'AC-15',
    judul: 'Ukur Tepat',
    ringkas: 'Satuan baku panjang, berat, dan isi: memilih, mengubah, membandingkan, menghitung',
    html: HTML_AC15,
  },
  {
    kode: 'AC-16',
    judul: 'Baca Batang',
    ringkas: 'Membaca diagram batang dan mengenali diagram yang menyesatkan',
    html: HTML_AC16,
  },
  {
    kode: 'AC-17',
    judul: 'Loncat dan Bagi',
    ringkas: 'Kelipatan, faktor, dan yang sama-sama dimiliki dua bilangan',
    html: HTML_AC17,
  },
  {
    kode: 'AC-18',
    judul: 'Pita Pecahan',
    ringkas: 'Membandingkan, mengurutkan, dan menyederhanakan pecahan dengan pita',
    html: HTML_AC18,
  },
  {
    kode: 'AC-19',
    judul: 'Garis Pecahan',
    ringkas: 'Pecahan sejati, tidak murni, dan campuran pada pita dan garis bilangan',
    html: HTML_AC19,
  },
  {
    kode: 'AC-20',
    judul: 'Tiga Wajah, Satu Nilai',
    ringkas: 'Pecahan, desimal, dan persen: mengubah, membandingkan, mengurutkan',
    html: HTML_AC20,
  },
  {
    kode: 'AC-21',
    judul: 'Saringan dan Pohon Faktor',
    ringkas: 'Bilangan prima, faktorisasi prima, FPB, dan KPK',
    html: HTML_AC21,
  },
  {
    kode: 'AC-22',
    judul: 'Hitung, Bulatkan, Taksir',
    ringkas: 'Hitung bilangan besar, pembulatan, dan estimasi',
    html: HTML_AC22,
  },
  {
    kode: 'AC-23',
    judul: 'Bulat Bertemu Pecahan',
    ringkas: 'Pecahan campuran dan operasi bilangan bulat dengan pecahan',
    html: HTML_AC23,
  },
  {
    kode: 'AC-24',
    judul: 'Neraca Persamaan',
    ringkas: 'Persamaan satu langkah dan operasi kebalikan',
    html: HTML_AC24,
  },
  {
    kode: 'AC-25',
    judul: 'Petak, Kubus, dan Akar',
    ringkas: 'Pangkat dua, pangkat tiga, dan akar',
    html: HTML_AC25,
  },
  {
    kode: 'AC-26',
    judul: 'Rumah dari Bangun',
    ringkas: 'Luas dan keliling bangun datar gabungan',
    html: HTML_AC26,
  },
  {
    kode: 'AC-27',
    judul: 'Luas Mundur',
    ringkas: 'Menentukan ukuran dari luas',
    html: HTML_AC27,
  },
  {
    kode: 'AC-28',
    judul: 'Isi dan Kulit Kotak',
    ringkas: 'Volume dan luas permukaan kubus, balok, dan gabungan',
    html: HTML_AC28,
  },
  {
    kode: 'AC-29',
    judul: 'Putar dan Ukur Sudut',
    ringkas: 'Jenis sudut, pasangan sudut, dan jumlah sudut bangun',
    html: HTML_AC29,
  },
  {
    kode: 'AC-30',
    judul: 'Jam dan Durasi',
    ringkas: 'Durasi, waktu mulai, dan waktu selesai',
    html: HTML_AC30,
  },
  {
    kode: 'AC-31',
    judul: 'Baca Data, Pilih Ukuran',
    ringkas: 'Diagram batang, rata-rata, median, modus, dan jangkauan',
    html: HTML_AC31,
  },
  {
    kode: 'D-01',
    judul: 'Naik Turun di Garis Bilangan',
    ringkas: 'Bilangan bulat: garis bilangan, nilai mutlak, operasi, dan urutan operasi',
    html: HTML_D01,
  },
  {
    kode: 'D-02',
    judul: 'Satu Nilai, Banyak Wajah',
    ringkas: 'Bilangan rasional: pecahan, desimal, persen, urutan, dan operasi',
    html: HTML_D02,
  },
  {
    kode: 'D-03',
    judul: 'Rasio dan Perbandingan',
    ringkas: 'Rasio, membagi menurut rasio, senilai dan berbalik nilai, serta skala',
    html: HTML_D03,
  },
  {
    kode: 'D-04',
    judul: 'Data dan Diagram',
    ringkas: 'Pertanyaan statistik, jenis data, memilih diagram, dan kesimpulan yang wajar',
    html: HTML_D04,
  },
  {
    kode: 'D-05',
    judul: 'Mean, Median, Modus',
    ringkas: 'Ukuran pemusatan dan jangkauan, nilai ekstrem, dan memilih ukuran yang tepat',
    html: HTML_D05,
  },
  {
    kode: 'D-06',
    judul: 'Hubungan Antar-Sudut',
    ringkas: 'Berpelurus, berpenyiku, bertolak belakang, garis sejajar dengan transversal, dan aljabar sudut',
    html: HTML_D06,
  },
  {
    kode: 'D-07',
    judul: 'Bentuk Aljabar',
    ringkas: 'Suku sejenis, menyederhanakan, sifat distributif, dan perkalian dua kurung',
    html: HTML_D07,
  },
  {
    kode: 'D-08',
    judul: 'Pangkat, Akar, Notasi Ilmiah',
    ringkas: 'Pangkat nol dan negatif, sifat pangkat, bentuk akar, dan notasi ilmiah',
    html: HTML_D08,
  },
  {
    kode: 'D-09',
    judul: 'Persamaan dan Pertidaksamaan',
    ringkas: 'PLSV dan pertidaksamaan linear satu variabel, termasuk membalik tanda dan soal cerita',
    html: HTML_D09,
  },
  {
    kode: 'D-10',
    judul: 'Kongruen dan Sebangun',
    ringkas: 'Kongruen, sebangun, faktor skala, metode bayangan, serta skala peta dan denah',
    html: HTML_D10,
  },
  {
    kode: 'D-11',
    judul: 'Jaring-Jaring Bangun Ruang',
    ringkas: 'Jaring-jaring kubus, balok, prisma, limas, rumus Euler, dan luas permukaan',
    html: HTML_D11,
  },
  {
    kode: 'D-12',
    judul: 'Teorema Pythagoras',
    ringkas: 'Hipotenusa, triple Pythagoras, mencari sisi, jenis segitiga, dan soal cerita',
    html: HTML_D12,
  },
  {
    kode: 'D-13',
    judul: 'Relasi, Fungsi, Koordinat',
    ringkas: 'Domain, range, fungsi, f(x), koordinat Kartesius, jarak, dan fungsi dalam keseharian',
    html: HTML_D13,
  },
  {
    kode: 'D-14',
    judul: 'Sistem Persamaan Linear',
    ringkas: 'SPLDV: grafik, substitusi, eliminasi, dan soal cerita',
    html: HTML_D14,
  },
  {
    kode: 'D-15',
    judul: 'Barisan dan Deret',
    ringkas: 'Barisan aritmetika dan geometri, suku ke-n, deret, dan soal cerita',
    html: HTML_D15,
  },
  {
    kode: 'D-16',
    judul: 'Transformasi Geometri',
    ringkas: 'Translasi, refleksi, rotasi, dan dilatasi pada titik',
    html: HTML_D16,
  },
]

export const daftarMateriInteraktif = DAFTAR

export function materiInteraktif(kode: string): MateriInteraktif | null {
  const k = kode.trim().toUpperCase()
  return DAFTAR.find(m => m.kode === k) ?? null
}
