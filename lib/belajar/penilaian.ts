/**
 * Yang tersisa dari penilaian di sisi TypeScript: penyajian angka, bukan
 * aturannya.
 *
 * `nilaiJawaban()` dulu tinggal di sini, dan kembarannya `gradeAnswer()` di
 * repo `form` (Sora). Komentar di keduanya menyebut kesamaannya sebagai inti —
 * tapi tidak ada satu pun mekanisme yang menjaganya, dan perbedaan di antara
 * keduanya tidak akan muncul sebagai galat melainkan sebagai nilai yang berbeda
 * untuk pekerjaan yang sama.
 *
 * Sejak migrasi 136/137 aturan itu punya SATU definisi: `nilai_jawaban()` di
 * Postgres, dipanggil kedua aplikasi lewat database yang memang sudah mereka
 * bagi — dua repo ini tidak berbagi paket npm, dan paket privat cuma akan
 * menukar duplikasi yang terlihat dengan version skew yang tidak. Sekalian,
 * skornya tidak bisa lagi dikarang pemanggil: `practice_record_answer()`
 * membaca kuncinya sendiri.
 *
 * Kesetaraannya dibuktikan sebelum berkas lama dihapus, dan tetap dijaga:
 * `scripts/uji-nilai-jawaban.ts` di repo form.
 */

/** Persentase dari skor maksimum, 0–100. Nol kalau tidak ada yang dikerjakan. */
export function persenDari(skor: number, maksimum: number): number {
  if (maksimum <= 0) return 0
  return Math.round((skor / maksimum) * 100)
}

/**
 * Skor parsial bisa pecahan panjang (bobot 3 dibagi 7 pernyataan), jadi
 * dibulatkan satu angka di belakang koma untuk dibaca.
 *
 * Skor sebagai angka yang dibaca orang Indonesia: koma, bukan titik, dan tanpa
 * ekor nol untuk nilai bulat. "0.7" di layar berbahasa Indonesia bukan sekadar
 * salah gaya — di kelas yang sama titik itu dipakai sebagai pemisah ribuan.
 */
export function angkaSkor(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}
