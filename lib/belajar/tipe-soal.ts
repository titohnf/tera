/**
 * Bentuk sebuah soal seperti yang dilihat pelajar — tanpa kunci jawaban.
 *
 * Salinan sadar dari `src/lib/types.ts` di repo `form` (Sora), dipersempit ke
 * apa yang dibutuhkan permukaan latihan. Kenapa disalin dan bukan dibagi: dua
 * repo ini tidak berbagi paket, hanya berbagi DATABASE. Yang mengikat keduanya
 * adalah bentuk kolom `question_bank_items`, dan itulah kontrak yang dijaga di
 * sini — bukan sebuah tipe TypeScript.
 *
 * Kalau tipe soal baru ditambahkan di Sora, dua berkas ini yang harus berubah
 * bersama: yang ini dan `penilaian.ts`.
 */

export type TipeSoal =
  | 'mcq_single'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'mcq_multi'
  | 'matching'
  | 'ordering'
  | 'fill_blank'
  | 'upload_file'
  | 'statement_grid'
  | 'true_false_two_tier'

export interface OpsiPilihan {
  choices: string[]
}

export interface PasanganJodoh {
  left: string
  right: string
}

export interface OpsiMenjodohkan {
  pairs: PasanganJodoh[]
}

export interface OpsiUrutan {
  items: string[]
}

export interface OpsiPernyataan {
  statements: string[]
  /** Label dua tombolnya, urut [benar, salah]. "Benar"/"Salah" kalau kosong. */
  answer_labels: [string, string]
  /** Judul kolom pernyataannya, mis. "Peristiwa". Opsional; kerap tidak ada. */
  statement_label?: string
}

/**
 * Opsi `true_false_two_tier`. Tingkat 1 selalu Benar/Salah — tidak perlu
 * ditulis penyusunnya — dan yang disimpan di sini hanya daftar alasan untuk
 * tingkat 2.
 */
export interface OpsiDuaTingkat {
  /** Pengantar daftar alasannya. "Alasannya:" kalau tidak diisi. */
  tier2_prompt?: string
  tier2_choices: string[]
}

export type OpsiSoal =
  | OpsiPilihan
  | OpsiMenjodohkan
  | OpsiUrutan
  | OpsiPernyataan
  | OpsiDuaTingkat
  | null

export type ModePenilaianPernyataan = 'proportional' | 'all_or_nothing'

/** Bentuk `correct_answer` untuk `statement_grid`, sejajar indeks dengan `statements`. */
export interface KunciPernyataan {
  answers: (boolean | null)[]
  grading_mode: ModePenilaianPernyataan
}

/**
 * Bentuk `correct_answer` untuk `true_false_two_tier`, sebagaimana dibaca
 * `nilai_jawaban()` sejak migrasi 138.
 */
export interface KunciDuaTingkat {
  tier1: 'true' | 'false'
  tier2: string
  /**
   * Nilai untuk "pernyataannya benar, alasannya keliru". 0,5 kalau tidak
   * disebut — FR5 menyerahkan besarannya kepada tim konten, jadi ia ikut di
   * kunci tiap butir, bukan dipatok di kode.
   */
  skor_sebagian?: number
}

/**
 * Jawaban yang dikirim untuk `true_false_two_tier`. Keduanya opsional: anak
 * bisa memilih pernyataannya lalu berhenti, dan itu keadaan yang dinilai —
 * bukan keadaan yang ditolak.
 */
export interface JawabanDuaTingkat {
  tier1?: 'true' | 'false'
  tier2?: string
}

/** Satu soal di layar. Kunci jawabannya tidak pernah ikut sampai sini. */
export interface SoalLatihan {
  id: string
  tipe: TipeSoal
  prompt: string
  opsi: OpsiSoal
  bobot: number
}

/**
 * Tipe yang tidak bisa dinilai otomatis, jadi tidak pernah diundi untuk
 * latihan. Kembarannya ada di `practice_open_session()` (migrasi 114) — daftar
 * ini ada di dua tempat karena penyaringan yang benar terjadi di database,
 * sementara yang di sini menjaga agar sesi lama yang terlanjur memuatnya tidak
 * membuat halaman menampilkan soal yang tidak bisa dijawab.
 */
export const TIPE_TANPA_NILAI_OTOMATIS: TipeSoal[] = ['essay', 'upload_file']
