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
export function acakOpsi<T extends SoalLatihan>(soal: T): { soal: T; urutan?: string[] } {
  if (soal.tipe !== 'mcq_single' && soal.tipe !== 'mcq_multi') return { soal }

  const pilihan = (soal.opsi as OpsiPilihan | null)?.choices
  // Dua opsi ke bawah tidak punya urutan yang bisa diacak dengan arti, dan
  // mengacaknya cuma membuat jejaknya penuh baris yang tidak menjelaskan apa pun.
  if (!pilihan || pilihan.length < 3) return { soal }

  const urutan = [...pilihan]
  for (let i = urutan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[urutan[i], urutan[j]] = [urutan[j], urutan[i]]
  }

  return { soal: { ...soal, opsi: { choices: urutan } }, urutan }
}
