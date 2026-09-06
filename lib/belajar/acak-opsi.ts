import type { OpsiPilihan, SoalLatihan } from './tipe-soal'

/**
 * Mengacak urutan opsi pilihan ganda sebelum ditampilkan (PRD FR3).
 *
 * KENAPA. Putaran kedua sebuah paket hanya memuat butir yang belum penuh
 * nilainya, jadi anak bertemu ulang soal yang persis sama. Kalau urutan opsinya
 * ikut sama, sebagian dari yang ia ingat adalah POSISI — "tadi yang ketiga" —
 * dan jawaban benar yang lahir dari ingatan posisi bukan bukti ia memahami
 * apa pun. Untuk sistem yang seluruh gunanya mengukur, itu bukan gangguan
 * kecil: ia membuat angka putaran kedua berbohong ke arah yang menyenangkan.
 *
 * BERLAKU DI SEMUA LATIHAN, bukan cuma paket pengukuran. Latihan bebas juga
 * punya putaran ulang sejak migrasi 134, jadi celahnya sama persis di sana —
 * dan aturan yang cuma berlaku di satu jalur adalah aturan yang harus diingat
 * setiap kali jalur ketiga dibuat.
 *
 * HANYA PILIHAN GANDA. Menjodohkan sudah mengacak kolom kanannya sendiri,
 * mengurutkan justru diuji urutannya, dan kisi pernyataan kerap punya urutan
 * yang bermakna (kronologis, bertingkat). Benar-Salah tidak ikut: menukar
 * "Benar" dan "Salah" bukan pengacakan, cuma membuat orang salah baca.
 *
 * Penilaian tidak terpengaruh sama sekali — jawaban dicatat sebagai TEKS opsi,
 * bukan posisinya, dan `nilai_jawaban()` membandingkan teks. Urutan yang
 * terlihat ikut disimpan sebagai jejak (`practice_answers.urutan_opsi`), supaya
 * analisis akhir pilot bisa memeriksa hal-hal seperti kecenderungan memilih
 * opsi pertama.
 */
export function acakOpsi<T extends SoalLatihan>(
  soal: T,
  /**
   * Benih pengacakan. Harus BERBEDA antar putaran dan SAMA antara server dan
   * browser — pemanggilnya menyusunnya dari id sesi dan id butir.
   *
   * Dulu di sini ada `Math.random()`, dan itu melahirkan cacat yang tidak
   * terlihat sampai konsol dibuka: `PelariSesi` adalah komponen klien yang
   * TETAP dirender di server lebih dulu, jadi server dan browser mengocok
   * kartu yang sama dua kali dan mendapat urutan berbeda. React membuang
   * pohon dari server lalu merendernya ulang — dan yang dilihat anak adalah
   * daftar opsi yang berpindah tempat sesaat setelah halaman muncul, persis
   * "daftar yang berubah urutan di bawah jari" yang dihindari di tempat lain
   * pada berkas ini.
   *
   * Benih membuat keduanya menghasilkan urutan yang sama tanpa mengorbankan
   * gunanya: putaran kedua sebuah paket berjalan di SESI yang baru (lihat
   * `ulangiPaket`), jadi benihnya berbeda dan urutannya tetap berganti.
   */
  benih: string
): { soal: T; urutan?: string[] } {
  if (soal.tipe !== 'mcq_single' && soal.tipe !== 'mcq_multi') return { soal }

  const pilihan = (soal.opsi as OpsiPilihan | null)?.choices
  // Dua opsi ke bawah tidak punya urutan yang bisa diacak dengan arti, dan
  // mengacaknya cuma membuat jejaknya penuh baris yang tidak menjelaskan apa pun.
  if (!pilihan || pilihan.length < 3) return { soal }

  const acak = pengacakBerbenih(benih)
  const urutan = [...pilihan]
  for (let i = urutan.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1))
    ;[urutan[i], urutan[j]] = [urutan[j], urutan[i]]
  }

  return { soal: { ...soal, opsi: { choices: urutan } }, urutan }
}

/**
 * Pengacak kecil yang hasilnya hanya bergantung pada benihnya (mulberry32).
 *
 * Ditulis sendiri, bukan diambil dari paket: yang dibutuhkan sepuluh baris,
 * dan sebuah ketergantungan baru untuk sepuluh baris adalah ongkos yang
 * dibayar selamanya. Mutunya tidak perlu kriptografis — yang diacak urutan
 * empat opsi soal, bukan kunci.
 */
function pengacakBerbenih(benih: string): () => number {
  let h = 1779033703 ^ benih.length
  for (let i = 0; i < benih.length; i++) {
    h = Math.imul(h ^ benih.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
