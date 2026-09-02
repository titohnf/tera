import { createClient } from '@/lib/supabase/server'

/**
 * Jalur MEMBACA peta kompetensi: angka yang dilihat orang tua di Penguasaan.
 *
 * Kenapa berkas sendiri dan bukan tambahan di `topik-peta.ts`: berkas itu jalur
 * BERBUAT — membuka putaran, mengunci paket, membuka kunci jawaban — dan dibuka
 * oleh anaknya. Yang di sini dibuka orang tua, tidak pernah menulis apa pun,
 * dan tunduk pada satu larangan tambahan yang tidak berlaku di sana.
 *
 * Larangan itu: SKOR PUTARAN 1 TIDAK PERNAH SAMPAI KE LAYAR KELUARGA. PRD FR3
 * melarangnya ditampilkan ke murid "dalam bentuk apa pun", dan migrasi 149
 * mencabut fungsi penghitungnya dari `public` dengan alasan bahwa fungsi di
 * skema `public` adalah antarmuka — komponen React tak kurang antarmuka.
 * Pemisahan berkas inilah yang membuat larangan itu bisa diperiksa dengan mata
 * alih-alih dipercaya: satu berkas, dan terlihat sekali pandang bahwa tidak ada
 * yang memulangkan angka putaran pertama. `topik_kemajuan()` sengaja
 * memulangkan `firstScore` null; `topik_skor_paket()` (149) tidak dipanggil
 * dari sini sama sekali dan memang bergerbang tutor.
 *
 * Yang TIDAK pernah dibaca dari sini: `question_bank_items`, `paket_topik_item`,
 * dan `topik_skor_paket`. Jalur grup boleh membaca `question_curriculum_tags`
 * langsung karena migrasi 094 membukanya untuk keluarga — tabel itu cuma berisi
 * pasangan id, tanpa teks soal maupun kunci. Jalur peta tidak punya padanan
 * yang dibuka begitu, jadi id butirnya datang lewat RPC.
 *
 * Seperti `topik-peta.ts`: seluruh gerbang ada di database (`practice_actor()`
 * dan `practice_only_public()`), tidak ada keputusan akses yang diambil di
 * berkas ini.
 */

const TANPA_KODE = ''

/**
 * Bentuk id topik pengukuran — `D-01`, `A-07`, `AB-12`.
 *
 * Dipakai membedakan rute `/penguasaan/[kunci]`: kunci yang cocok pola ini
 * adalah topik peta, sisanya id grup kurikulum yang berbentuk uuid.
 *
 * Definisinya sendiri pindah ke `kode-topik.ts` sejak `HeaderKeluarga` — sebuah
 * komponen KLIEN — ikut perlu membedakan keduanya untuk memilih tujuan panah
 * kembali. Berkas ini mengimpor klien Supabase sisi server, jadi ia tidak bisa
 * jadi jalan masuknya ke browser. Diteruskan di sini supaya pemanggil sisi
 * server tidak perlu tahu perpindahan itu.
 */
export { KODE_TOPIK, adalahKodeTopik } from '@/lib/belajar/kode-topik'

/**
 * Kemajuan satu topik peta.
 *
 * Bentuknya menyalin `KemajuanTopik` (jalur grup) supaya satu pembangun baris
 * di halaman Penguasaan bisa melayani keduanya, dan keduanya tidak bisa
 * diam-diam berbeda arti. Bedanya cuma dua: kuncinya `topikId` bertipe teks,
 * dan `firstScore` selalu null.
 */
export interface KemajuanTopikPeta {
  topikId: string
  nama: string
  elemen: string
  jenjangKelas: string
  /** Mapel dipinjam dari kurikulum bimbel lewat `topik_grup`, demi rubriknya. */
  subjectId: string | null
  answered: number
  total: number
  score: number
  maxScore: number
  /** Bobot SELURUH butir paket latihan topik ini: penyebut penguasaan. */
  maxAvailable: number
  /**
   * SELALU NULL, dan itu bukan data yang hilang.
   *
   * Di jalur grup kolom kembarannya menghidupkan baris "Naik dari X%". Di sini
   * nilai jawaban pertama tiap butir adalah Skor Putaran 1 — lihat kepala
   * berkas. Kolomnya dipertahankan supaya bentuknya sama, isinya tidak pernah
   * dikirim database.
   */
  firstScore: null
  correct: number
  partial: number
  wrong: number
  /** Paket LATIHAN saja. Paket ujian dilaporkan terpisah di halaman rincian. */
  paketTotal: number
  paketTuntas: number
  paketSempurna: number
}

const angka = (n: number | string | null | undefined) => Number(n ?? 0)

/**
 * Kemajuan seluruh topik peta yang aktif untuk pelajar ini (migrasi 161).
 *
 * `null` berarti kuerinya GAGAL — berbeda dari daftar kosong, yang berarti
 * memang belum ada yang dikerjakan. Halaman Penguasaan menampilkan keduanya
 * dengan cara berbeda, dan menyamakannya berarti menuduh anak belum
 * mengerjakan apa-apa untuk sesuatu yang salah di sisi kita.
 *
 * Penyebutnya paket `latihan` saja, sama persis dengan `topik_tersedia()` yang
 * dipakai peta anaknya. Kalau berbeda, peta anak dan laporan orang tua akan
 * menyebut dua angka penguasaan pada hari yang sama.
 */
export async function kemajuanTopikPeta(
  learnerId: string
): Promise<KemajuanTopikPeta[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_kemajuan', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membaca kemajuan topik peta:', error)
    return null
  }
  type Baris = {
    topik_id: string
    nama: string | null
    elemen: string | null
    jenjang_kelas: string | null
    subject_id: string | null
    answered: number | string
    total: number | string
    score: number | string
    max_score: number | string
    max_available: number | string
    correct: number | string
    partial: number | string
    wrong: number | string
    paket_total: number | string
    paket_tuntas: number | string
    paket_sempurna: number | string
  }
  return ((data as Baris[] | null) ?? []).map(b => ({
    topikId: b.topik_id,
    nama: b.nama ?? b.topik_id,
    elemen: b.elemen ?? '',
    jenjangKelas: b.jenjang_kelas ?? '',
    subjectId: b.subject_id,
    answered: angka(b.answered),
    total: angka(b.total),
    score: angka(b.score),
    maxScore: angka(b.max_score),
    maxAvailable: angka(b.max_available),
    firstScore: null,
    correct: angka(b.correct),
    partial: angka(b.partial),
    wrong: angka(b.wrong),
    paketTotal: angka(b.paket_total),
    paketTuntas: angka(b.paket_tuntas),
    paketSempurna: angka(b.paket_sempurna),
  }))
}

/** Satu butir sebuah paket, beserta identitas paketnya. */
export interface ButirPaketTopik {
  paketId: string
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
  itemId: string
  ord: number
}

/**
 * Keanggotaan SELURUH paket sebuah topik dalam satu perjalanan (migrasi 161).
 *
 * `isiPaketTopik()` di `topik-peta.ts` menjawab untuk satu paket, dan itu yang
 * dibutuhkan layar mengerjakan. Halaman rincian membutuhkan semuanya sekaligus
 * beserta identitas paketnya — jalur grup bisa berkunci nomor urut karena
 * paketnya sekadar pembagian sepuluh-sepuluh, jalur peta tidak: paketnya
 * dibedakan jenis dan level Bloom.
 *
 * Paket ujian IKUT di sini, berbeda dari `kemajuanTopikPeta()`. Halaman
 * rincian memang harus menampilkannya; yang tidak boleh adalah ikut jadi
 * penyebut angka penguasaan.
 */
export async function isiPaketTopikSemua(
  learnerId: string,
  topikId: string
): Promise<ButirPaketTopik[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_isi_paket', {
    p_topik_id: topikId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membaca isi paket topik:', error)
    return []
  }
  type Baris = {
    paket_id: string
    jenis: string
    level_bloom: number | null
    nomor: number | string
    item_id: string
    ord: number | string
  }
  return ((data as Baris[] | null) ?? []).map(b => ({
    paketId: b.paket_id,
    jenis: b.jenis === 'ujian' ? 'ujian' : 'latihan',
    levelBloom: b.level_bloom == null ? null : Number(b.level_bloom),
    nomor: angka(b.nomor),
    itemId: b.item_id,
    ord: angka(b.ord),
  }))
}
