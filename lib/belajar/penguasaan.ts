/**
 * Pita penguasaan sebuah mapel dan cara membacanya.
 *
 * Modul terpisah, dan sengaja TANPA satu pun impor sisi server: label ini
 * dipakai di halaman hasil (server) sekaligus di daftar topik (browser), dan
 * satu-satunya cara memastikan keduanya menyebut angka yang sama dengan nama
 * yang sama adalah memakai fungsi yang sama.
 */

/** Ambang penguasaan milik mapel, atau null kalau kelasnya tidak punya rubrik. */
export interface PitaPenguasaan {
  min: number
  label: string
}

/**
 * Label penguasaan untuk sebuah persentase — pita tertinggi yang tercapai.
 * Null kalau mapelnya tidak punya rubrik, dan pemanggilnya menampilkan angka
 * mentah. Tidak ada satu pun label TKA yang ditulis di sini; semuanya datang
 * dari `classes.mastery_rubric`.
 */
export function labelPenguasaan(
  rubrik: PitaPenguasaan[] | null,
  persen: number
): string | null {
  if (!rubrik || rubrik.length === 0) return null
  // Tidak dianggap terurut: kolomnya JSON bebas dan baris lama bisa lahir
  // sebelum penyuntingnya mengurutkan saat menyimpan.
  const tercapai = [...rubrik].sort((a, b) => a.min - b.min).filter(p => persen >= p.min)
  return tercapai.length > 0 ? tercapai[tercapai.length - 1].label : rubrik[0].label
}

/** Hasil jawaban terakhir sebuah topik, sebagaimana dicacah migrasi 130. */
export interface RincianJawaban {
  /** Nilai penuh. */
  correct: number
  /** Dapat sebagian — `statement_grid` dan `mcq_multi` bisa begitu. */
  partial: number
  /** Nol. */
  wrong: number
  /** Belum pernah dijawab. */
  belum: number
}

/**
 * Kalimat "2 benar · 9 salah · 3 belum dikerjakan".
 *
 * "Benar" SELALU disebut, bahkan nol: baris yang melompatinya membuat "9 salah"
 * berdiri sendirian tanpa pembanding, dan nol benar adalah kabar yang justru
 * paling perlu terbaca. Sisanya hanya muncul kalau ada — "0 sebagian benar" di
 * mapel yang tidak punya satu pun soal bernilai sebagian cuma kebisingan.
 *
 * Bukan persen, dan itu maksudnya: persen sudah berdiri di sebelahnya dengan
 * labelnya sendiri, dan yang belum terjawab oleh keduanya justru pertanyaan
 * paling sederhana — berapa yang benar.
 */
export function rincianJawaban(r: RincianJawaban): string {
  const bagian = [`${r.correct} benar`]
  if (r.partial > 0) bagian.push(`${r.partial} sebagian benar`)
  if (r.wrong > 0) bagian.push(`${r.wrong} salah`)
  if (r.belum > 0) bagian.push(`${r.belum} belum dikerjakan`)
  return bagian.join(' · ')
}

/**
 * Pita rubrik beserta rentangnya, untuk ditampilkan sebagai legenda.
 *
 * Batas atas tiap pita diturunkan dari `min` pita berikutnya — rubriknya cuma
 * menyimpan ambang bawah, dan legenda yang menyebut "50%" tanpa ujungnya
 * menyuruh pembacanya menyusun sendiri rentang yang sudah kita ketahui.
 */
export function rentangPita(
  rubrik: PitaPenguasaan[] | null
): { label: string; dari: number; sampai: number }[] {
  if (!rubrik || rubrik.length === 0) return []
  const urut = [...rubrik].sort((a, b) => a.min - b.min)
  return urut.map((p, i) => ({
    label: p.label,
    dari: p.min,
    sampai: i + 1 < urut.length ? urut[i + 1].min - 1 : 100,
  }))
}
