import { createClient } from '@/lib/supabase/server'
import type { OpsiSoal, SoalLatihan, TipeSoal } from './tipe-soal'
import { TIPE_TANPA_NILAI_OTOMATIS } from './tipe-soal'
import { nilaiJawaban } from './penilaian'

/**
 * Satu-satunya tempat RPC `practice_*` dipanggil dari repo ini.
 *
 * Dipusatkan bukan demi kerapian melainkan demi satu aturan yang harus mudah
 * diperiksa: `p_learner_id` SELALU berasal dari `belajarContext()`, tidak
 * pernah dari browser. Kalau halaman boleh memanggil RPC-nya sendiri, cepat
 * atau lambat ada yang meneruskan learner id dari query string, dan gerbang di
 * database (`practice_actor`) memang menahan — tapi hanya karena kebetulan
 * seseorang mengingatnya.
 *
 * `p_access_code` selalu kosong di sini. Kode akses adalah pintu Sora untuk
 * anak yang berlatih di perangkat tutor; permukaan ini selalu bekerja dari sesi
 * login. Lihat alasan panjangnya di `lib/belajar/konteks.ts`.
 *
 * Fungsi yang dipakai di bawah datang dari tiga migrasi: 092 (undian, kunci,
 * ringkasan), 110 (saringan soal publik), dan 114 (sesi yang bisa dilanjutkan).
 */

const TANPA_KODE = ''

export interface MapelLatihan {
  subject_id: string
  subject_name: string
  question_count: number
}

export interface TopikLatihan {
  group_id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  question_count: number
}

/** Satu soal sesi beserta apa yang sudah terjadi padanya. */
export interface SoalSesi extends SoalLatihan {
  sudahDijawab: boolean
  benar: boolean | null
  skor: number | null
  skorMaks: number | null
}

export interface SkorTopik {
  group_id: string
  topic: string
  theme: string | null
  answered: number
  score: number
  max_score: number
}

/** Ambang penguasaan milik mapel, atau null kalau kelasnya tidak punya rubrik. */
export interface PitaPenguasaan {
  min: number
  label: string
}

export interface HasilJawab {
  benar: boolean
  skor: number
  skorMaks: number
  pembahasan: string | null
}

interface BarisKeadaanSesi {
  item_id: string
  ord: number
  type: TipeSoal
  prompt: string
  options: OpsiSoal
  weight: number | string
  stimulus_images: string[] | null
  answered: boolean
  is_correct: boolean | null
  score: number | string | null
  max_score: number | string | null
}

interface BarisKunci {
  type: TipeSoal
  options: OpsiSoal
  correct_answer: unknown
  weight: number | string
  explanation: string | null
}

export interface PemilikSesi {
  learnerId: string
  nama: string
  /** Profil pelajarnya: id anak untuk jalur keluarga, id sendiri untuk pelanggan. */
  profileId: string | null
}

/**
 * Sesi ini milik siapa — dan sekaligus apakah pemanggil berhak membukanya.
 *
 * Null berarti tidak berhak ATAU sesinya tidak ada, dan halamannya
 * memperlakukan keduanya sama: kembali ke daftar mapel. Membedakan keduanya di
 * layar berarti memberi tahu orang asing bahwa sebuah id sesi itu nyata.
 */
export async function pemilikSesi(sesiId: string): Promise<PemilikSesi | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('practice_session_owner', {
    p_session_id: sesiId,
    p_access_code: TANPA_KODE,
  })
  const baris = (data as { learner_id: string; learner_name: string; profile_id: string | null }[] | null)?.[0]
  if (!baris) return null
  return { learnerId: baris.learner_id, nama: baris.learner_name, profileId: baris.profile_id }
}

/** Mapel yang benar-benar punya soal untuk pelajar ini. Menu kosong tidak pernah disodorkan. */
export async function mapelLatihan(learnerId: string): Promise<MapelLatihan[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('practice_subjects', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  return (data as MapelLatihan[] | null) ?? []
}

export async function topikLatihan(
  learnerId: string,
  subjectId: string
): Promise<TopikLatihan[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('practice_topics', {
    p_access_code: TANPA_KODE,
    p_subject_id: subjectId,
    p_learner_id: learnerId,
  })
  return (data as TopikLatihan[] | null) ?? []
}

export async function rubrikMapel(subjectId: string): Promise<PitaPenguasaan[] | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('mastery_rubric_for', { p_subject_id: subjectId })
  return (data as PitaPenguasaan[] | null) ?? null
}

/**
 * Membuka sesi baru dan mengundi soalnya sekaligus, di database.
 *
 * Null berarti tidak ada satu pun soal yang cocok — topiknya kosong untuk
 * pelajar ini, atau seluruh isinya bertipe yang tidak dinilai otomatis. Bukan
 * galat, dan halamannya menerjemahkannya jadi kalimat, bukan jadi layar rusak.
 */
export async function bukaSesi(
  learnerId: string,
  subjectId: string,
  groupIds: string[],
  jumlah: number
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_open_session', {
    p_subject_id: subjectId,
    p_group_ids: groupIds,
    p_limit: jumlah,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membuka sesi:', error)
    return null
  }
  return (data as string | null) ?? null
}

/**
 * Isi sebuah sesi beserta kemajuannya, atau daftar kosong kalau sesi itu bukan
 * milik pemanggil. Gerbangnya di `practice_session_state()`, bukan di sini.
 */
export async function keadaanSesi(sesiId: string): Promise<SoalSesi[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_session_state', {
    p_session_id: sesiId,
    p_access_code: TANPA_KODE,
  })
  if (error) {
    console.error('[belajar] gagal membaca keadaan sesi:', error)
    return []
  }

  return ((data as BarisKeadaanSesi[] | null) ?? [])
    // Sesi lama bisa memuat tipe yang tidak bisa dijawab di sini. Dilewati,
    // bukan ditampilkan sebagai soal buntu.
    .filter(baris => !TIPE_TANPA_NILAI_OTOMATIS.includes(baris.type))
    .map(baris => ({
      id: baris.item_id,
      tipe: baris.type,
      prompt: baris.prompt,
      opsi: baris.options,
      bobot: Number(baris.weight) || 1,
      gambar: baris.stimulus_images ?? [],
      sudahDijawab: baris.answered,
      benar: baris.is_correct,
      skor: baris.score === null ? null : Number(baris.score),
      skorMaks: baris.max_score === null ? null : Number(baris.max_score),
    }))
}

/**
 * Menilai satu jawaban lalu mencatatnya.
 *
 * Kuncinya diambil di sini, di server, dan tidak pernah sampai ke browser
 * sebelum pemakainya menjawab — itulah kenapa penilaian tidak bisa dipindah ke
 * komponen klien betapapun terasa lebih gesit.
 */
export async function jawabSoal(
  learnerId: string,
  sesiId: string,
  itemId: string,
  jawaban: unknown
): Promise<HasilJawab | null> {
  const supabase = await createClient()

  const { data: kunciRows } = await supabase.rpc('practice_answer_key', {
    p_access_code: TANPA_KODE,
    p_item_id: itemId,
    p_learner_id: learnerId,
  })
  const kunci = (kunciRows as BarisKunci[] | null)?.[0]
  if (!kunci) return null

  const bobot = Number(kunci.weight) || 1
  const { nilai } = nilaiJawaban(
    { tipe: kunci.type, opsi: kunci.options, bobot, kunci: kunci.correct_answer },
    jawaban
  )
  // Tipe tanpa nilai otomatis tidak pernah diundi ke sini; kalau toh sampai,
  // yang benar adalah menolak mencatat, bukan mencatat nol.
  if (nilai === null) return null

  const { data: tercatat, error } = await supabase.rpc('practice_record_answer', {
    p_session_id: sesiId,
    p_item_id: itemId,
    p_response: jawaban ?? null,
    p_is_correct: nilai >= bobot,
    p_score: nilai,
    p_max_score: bobot,
    p_access_code: TANPA_KODE,
  })
  if (error || tercatat === false) {
    console.error('[belajar] gagal mencatat jawaban:', error)
    return null
  }

  return {
    benar: nilai >= bobot,
    skor: nilai,
    skorMaks: bobot,
    pembahasan: kunci.explanation,
  }
}

export async function tutupSesi(sesiId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('practice_finish_session', {
    p_session_id: sesiId,
    p_access_code: TANPA_KODE,
  })
  if (error) console.error('[belajar] gagal menutup sesi:', error)
}

export async function ringkasanSesi(
  learnerId: string,
  sesiId: string
): Promise<SkorTopik[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_summary', {
    p_access_code: TANPA_KODE,
    p_session_id: sesiId,
    p_learner_id: learnerId,
  })
  if (error) console.error('[belajar] gagal menghitung ringkasan:', error)
  return (data as SkorTopik[] | null) ?? []
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
