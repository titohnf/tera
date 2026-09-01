import { createClient } from '@/lib/supabase/server'
import { adalahVideo } from './sematan'
import { ALL_GRADES } from '@/lib/curriculum-config'
import type { OpsiSoal, SoalLatihan, TipeSoal } from './tipe-soal'
import { TIPE_TANPA_NILAI_OTOMATIS } from './tipe-soal'
import type { PitaPenguasaan } from './penguasaan'

// Pita penguasaan dan penerjemahnya tinggal di modul sendiri: keduanya murni
// perhitungan, dan berkas ini menarik klien Supabase sisi server — sebuah
// komponen browser yang cuma butuh labelnya tidak boleh ikut menyeret itu.
// Diekspor ulang dari sini supaya pemanggil lama tidak perlu tahu.
export { labelPenguasaan } from './penguasaan'
export type { PitaPenguasaan } from './penguasaan'

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

/** Soal, materi, dan kemajuan sebuah mapel dalam satu lingkup jenjang. */
export interface HitunganMapel {
  question_count: number
  /** Bahan baca. Bisa nol, dan itu disebutkan. */
  materi_count: number
  /** Materi yang berupa video (YouTube). Disebut terpisah, bukan dijumlahkan. */
  video_count: number
  /**
   * Berapa soal berbeda yang sudah pernah dijawab pelajar ini.
   *
   * Null berarti BELUM DIKETAHUI, bukan nol — `practice_progress()` gagal atau
   * belum ada. Layar tidak menggambar cincin kemajuan untuk nilai null;
   * menggambarnya kosong berarti memberitahu anak bahwa ia belum mengerjakan
   * apa-apa, dan itu bisa keliru.
   */
  answered_count: number | null
}

export interface MapelLatihan extends HitunganMapel {
  subject_id: string
  subject_name: string
  /** Punya kurikulum di jenjang pelajar. */
  di_kelas: boolean
  /**
   * Hitungan yang sama, tapi UNTUK JENJANG PELAJAR SAJA. Null kalau jenjangnya
   * tidak diketahui atau angkanya tidak bisa diambil.
   *
   * Dua lingkup dibawa sekaligus karena layar memakai keduanya: mapel yang sama
   * muncul di "Tersedia di Kelasmu" dengan angka kelasnya, dan di "Dari Seluruh
   * Kelas" dengan angka seluruh jenjang.
   */
  kelas: HitunganMapel | null
}

export interface TopikLatihan {
  group_id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  question_count: number
  /**
   * Soal BERBEDA di topik ini yang sudah pernah dijawab pelajar (migrasi 128).
   *
   * Null berarti BELUM DIKETAHUI, bukan nol — alasan yang sama dengan
   * `HitunganMapel.answered_count`: baris yang berkata "0 dikerjakan" karena
   * kuerinya gagal adalah kabar bohong yang tidak bisa dibedakan anak dari
   * kabar benar.
   */
  answered_count: number | null
  /**
   * Nilai jawaban TERAKHIR di topik ini, dan nilai maksimumnya. Keduanya nol
   * berarti belum ada yang dijawab — pemanggilnya tidak menghitung persen dari
   * penyebut nol.
   */
  score: number
  max_score: number
  /**
   * Bobot SELURUH soal topik — penyebut penguasaan (migrasi 129). BUKAN
   * `max_score`: yang terakhir cuma menghitung soal yang sudah dijawab, dan
   * memakainya sebagai penyebut membuat satu soal benar dari tiga terbaca
   * seratus persen.
   */
  max_available: number
  /** Nilai jawaban PERTAMA tiap soal, untuk menyebutkan kenaikannya. */
  first_score: number
  /** Cacah hasil jawaban terakhir: penuh, sebagian, nol (migrasi 130). */
  correct: number
  partial: number
  wrong: number
  /** Paket di topik ini, berapa yang tuntas, dan berapa yang benar semua. */
  paket_total: number
  paket_tuntas: number
  paket_sempurna: number
}

/** Bentuk mentah dari `practice_topics()`, sebelum kemajuannya ditempelkan. */
type BarisTopik = Omit<TopikLatihan, 'answered_count' | 'score' | 'max_score'>

/** Satu soal sesi beserta apa yang sudah terjadi padanya. */
export interface SoalSesi extends SoalLatihan {
  sudahDijawab: boolean
  benar: boolean | null
  skor: number | null
  skorMaks: number | null
}

/** Satu soal sesi yang sudah selesai, siap ditinjau — kunci jawabannya ikut. */
export interface SoalTinjauan extends SoalLatihan {
  /** Nomor undian, mulai dari 1. */
  nomor: number
  /** Yang dikirim anaknya; null kalau soal itu dilewati. */
  jawaban: unknown
  kunci: unknown
  pembahasan: string | null
  sudahDijawab: boolean
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

interface BarisTinjauanSesi {
  item_id: string
  ord: number
  type: TipeSoal
  prompt: string
  options: OpsiSoal
  weight: number | string
  response: unknown
  answered: boolean
  is_correct: boolean | null
  score: number | string | null
  max_score: number | string | null
  correct_answer: unknown
  explanation: string | null
}

/**
 * Kembalian `practice_record_answer()` sesudah migrasi 137. Angkanya datang
 * sebagai string dari PostgREST (numeric tidak dipetakan ke number JavaScript
 * yang bisa kehilangan presisi), jadi pemanggilnya yang mengubahnya.
 */
interface BarisJawabTercatat {
  skor: number | string
  skor_maks: number | string
  benar: boolean
  pembahasan: string | null
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

export interface SesiTertunda {
  sesiId: string
  jumlahSoal: number
  sudahDijawab: number
  /** Semua soalnya sudah dijawab; yang tersisa cuma membuka hasilnya. */
  tinggalHasil: boolean
  /** Nama mapelnya, mis. "Matematika" — null kalau sesinya tanpa mapel. */
  mapel: string | null
  /** Jenjang topiknya, mis. "Kelas 7". Diambil dari topik pertama. */
  jenjang: string | null
  /** Topik yang dipilih. Lebih dari satu diringkas jadi "A +2 topik". */
  topik: string | null
}

/**
 * Id pelajar milik seorang anak — null kalau ia belum pernah berlatih.
 *
 * Dipakai beranda portal keluarga, yang menawarkan sesi tertunda tanpa pernah
 * membuka permukaan belajar. `belajarContext()` TIDAK dipakai di sana dengan
 * sengaja: RPC-nya, `practice_start_as_child()`, bersifat volatile — ia
 * MEMBUAT baris `learners` kalau belum ada. Memanggilnya dari beranda berarti
 * setiap anak yang berandanya pernah dibuka mendapat identitas latihan, padahal
 * migrasi 092 menaruh kelahiran baris itu tepat di saat anaknya benar-benar
 * mulai berlatih.
 *
 * `practice_children()` cuma membaca (left join, `learner_id` null kalau
 * belum ada) dan bergerbang `my_students()` — jadi id anak yang dikarang tidak
 * menghasilkan apa pun. Null di sini berarti belum pernah ada sesi sama sekali,
 * yang memang tidak punya apa-apa untuk dilanjutkan.
 */
export async function learnerAnak(studentId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('practice_children')
  const baris = (data as { student_id: string; learner_id: string | null }[] | null) ?? []
  return baris.find(b => b.student_id === studentId)?.learner_id ?? null
}

/**
 * Sesi yang ditinggalkan di tengah jalan, kalau ada.
 *
 * Tanpa ini, kemampuan melanjutkan sesi yang dibangun migrasi 114 TIDAK BISA
 * DIJANGKAU: rute sesi tidak ditautkan dari mana pun, jadi satu-satunya jalan
 * kembali adalah alamat yang kebetulan masih tersimpan di riwayat peramban.
 * Kartunya berdiri di beranda portal keluarga — lihat `learnerAnak`.
 *
 * Yang dicari BUKAN sekadar sesi terbaru yang belum selesai. Menekan "Mulai
 * Latihan" lalu berubah pikiran meninggalkan sesi kosong, dan sesi kosong
 * menawarkan tepat apa yang ditawarkan tombol "Mulai Latihan" — sambil menutupi
 * sesi sungguhan yang ditinggalkan sebelumnya. Karena itu syaratnya: PALING
 * TIDAK SATU SOAL SUDAH DIJAWAB.
 *
 * Sesi yang seluruh soalnya sudah dijawab tapi belum tertutup ikut dikembalikan
 * — itu justru kasus yang paling perlu dijemput, karena membukanya yang akan
 * mengisi `finished_at` yang tertinggal. Halaman sesi mengalihkannya ke hasil,
 * dan halaman hasil yang menutupnya.
 *
 * Sesi Sora lama dilewati (`item_ids` kosong): ia tidak punya undian tersimpan,
 * jadi halaman sesinya akan memulangkan pembacanya ke sini lagi — pintu yang
 * berputar kembali ke dirinya sendiri.
 *
 * Dan yang ditinggalkan berhenti ditawarkan begitu ada sesi LAIN yang SELESAI
 * sesudahnya. Ini bukan kerapian melainkan syarat supaya beranda dan menu
 * latihan tidak bercerita beda: Hafidz meninggalkan sesi Bilangan Real pada
 * jam 00.40 dengan 2 dari 10 soal, lalu sore harinya mengerjakan topik yang
 * sama sampai tuntas di sesi baru. Menu latihan berkata topiknya 11/11
 * dikerjakan, sementara beranda tetap menawarkan "Lanjutkan latihan · 20%" ke
 * undian basi dari pagi. Keduanya benar menurut hitungannya sendiri, dan justru
 * itu yang membuat pembacanya berhenti percaya pada keduanya.
 *
 * Sesi yang ditinggalkan tidak menyimpan apa pun yang hilang kalau ia
 * dilupakan: isinya undian sepuluh soal yang bisa diundi lagi kapan saja. Yang
 * mahal justru sebaliknya — mengajak anak kembali ke pekerjaan yang sudah ia
 * lewati.
 */
export async function sesiTertunda(learnerId: string): Promise<SesiTertunda | null> {
  const supabase = await createClient()

  // Sesi yang SUDAH selesai ikut diambil, tidak disaring di kueri seperti dulu:
  // yang menentukan sebuah sesi tertunda masih layak ditawarkan bukan cuma
  // keadaannya sendiri, melainkan apa yang terjadi sesudahnya.
  const { data } = await supabase
    .from('practice_sessions')
    .select('id, item_ids, subject_id, group_ids, finished_at')
    .eq('learner_id', learnerId)
    .order('started_at', { ascending: false })
    .limit(10)

  type Baris = {
    id: string
    item_ids: string[] | null
    subject_id: string | null
    group_ids: string[] | null
    finished_at: string | null
  }

  // Berhenti di sesi selesai yang pertama ditemui — daftarnya urut dari yang
  // paling baru, jadi apa pun di belakangnya sudah didahului sesi itu.
  const semua = (data as Baris[] | null) ?? []
  const batas = semua.findIndex(r => r.finished_at)
  const kandidat = (batas === -1 ? semua : semua.slice(0, batas)).filter(
    r => (r.item_ids?.length ?? 0) > 0
  )
  if (kandidat.length === 0) return null

  // Satu kueri untuk semua kandidat, bukan satu per sesi: jumlahnya kecil, tapi
  // "satu kueri per baris di layar" adalah kebiasaan yang mahalnya baru terasa
  // setelah terlambat.
  const { data: jawaban } = await supabase
    .from('practice_answers')
    .select('session_id, question_bank_item_id')
    .in(
      'session_id',
      kandidat.map(k => k.id)
    )

  // SOAL BERBEDA, bukan banyaknya baris jawaban. `practice_record_answer` (114)
  // menyisipkan tanpa kunci unik, jadi satu soal yang tercatat dua kali —
  // ketukan ganda, halaman yang dimuat ulang di detik yang salah — akan membuat
  // pembilangnya melewati penyebutnya, dan kartunya berkata "lihat hasil" untuk
  // sesi yang soalnya belum habis.
  const terjawab = new Map<string, Set<string>>()
  for (const baris of (jawaban as { session_id: string; question_bank_item_id: string }[] | null) ??
    []) {
    const ada = terjawab.get(baris.session_id)
    if (ada) ada.add(baris.question_bank_item_id)
    else terjawab.set(baris.session_id, new Set([baris.question_bank_item_id]))
  }

  const sesi = kandidat.find(k => (terjawab.get(k.id)?.size ?? 0) > 0)
  if (!sesi) return null

  const jumlahSoal = sesi.item_ids!.length
  const sudahDijawab = terjawab.get(sesi.id)?.size ?? 0

  // Mapel dan topiknya cuma LABEL — kartu di beranda menyebutkan sesi ini
  // tentang apa, supaya "Lanjutkan latihan" tidak menuntut pembacanya mengingat
  // sendiri apa yang ditinggalkannya. Keduanya boleh gagal tanpa akibat: sesi
  // Sora lama bisa tidak punya `subject_id`, dan topik yang dihapus dari
  // kurikulum meninggalkan `group_ids` yang tidak lagi bertuan. Yang hilang cuma
  // barisnya, bukan kartunya.
  const grupIds = sesi.group_ids ?? []
  const [mapelRow, grupRows] = await Promise.all([
    sesi.subject_id
      ? supabase.from('subjects').select('name').eq('id', sesi.subject_id).maybeSingle()
      : Promise.resolve({ data: null }),
    grupIds.length
      ? supabase.from('curriculum_topic_groups').select('topic, grade_level').in('id', grupIds)
      : Promise.resolve({ data: null }),
  ])

  const grup = (grupRows.data ?? []) as { topic: string; grade_level: string }[]
  const topik = grup.length === 0
    ? null
    // Lebih dari satu topik diringkas, tidak dirangkai: tiga nama topik
    // kurikulum berjejer melewati lebar layar dan terpotong di tengah kata,
    // yang lebih buruk daripada tidak menyebutkan yang kedua sama sekali.
    : grup.length === 1
      ? grup[0].topic
      : `${grup[0].topic} +${grup.length - 1} topik`

  return {
    sesiId: sesi.id,
    jumlahSoal,
    sudahDijawab,
    tinggalHasil: sudahDijawab >= jumlahSoal,
    mapel: ((mapelRow.data as { name: string } | null)?.name) ?? null,
    jenjang: grup[0]?.grade_level ?? null,
    topik,
  }
}

/** Mapel yang benar-benar punya soal untuk pelajar ini. Menu kosong tidak pernah disodorkan. */
/**
 * Mapel yang punya soal, materi, atau keduanya.
 *
 * `practice_subjects()` hanya tahu soal — ia menyaring habis mapel yang nol
 * soal, dan itu benar untuk Sora yang seluruhnya tentang berlatih. Di sini
 * mapel yang baru punya bahan bacaan tetap harus muncul, karena materi adalah
 * separuh dari yang dijanjikan permukaan ini. Penggabungannya dikerjakan di
 * sini, bukan dengan mengubah fungsi bersamanya (lihat migrasi 122).
 *
 * `curriculum_resources` dibaca lewat client sesi seperti semua yang lain, jadi
 * yang memutuskan tetap RLS: keluarga lewat 076, pelanggan lewat 119 —
 * `kind = 'materi'` saja untuk yang terakhir.
 */
export async function mapelLatihan(
  learnerId: string,
  /**
   * Jenjang si pelajar. Kosong berarti tidak diketahui — hanya angka seluruh
   * jenjang yang dihitung, dan layar tidak memisahkan apa pun.
   */
  jenjang: string[] = []
): Promise<MapelLatihan[]> {
  const supabase = await createClient()
  const [
    { data: bersoal },
    { data: materi },
    { data: kelompokKelas },
    { data: mapelKelas, error: galatKelas },
    { data: mapelSemua, error: galatSemua },
  ] = await Promise.all([
    supabase.rpc('practice_subjects', { p_access_code: TANPA_KODE, p_learner_id: learnerId }),
    supabase
      .from('curriculum_resources')
      .select('subject_id, grade_level, link_url, subjects(name)')
      .eq('kind', 'materi')
      // Ukuran yang sama dengan `materiTopik()`, dan itu yang membuat angka di
      // kartu mapel sama dengan isi yang terbuka begitu mapelnya diketuk.
      .not('readable_at', 'is', null),
    // Penanda segmen: mapel yang punya kurikulum di jenjang si anak. Keluarga
    // boleh membaca tabel ini sejak 076; pelanggan langganan tidak — dan mereka
    // memang tidak punya kelas, jadi cabang ini tidak berjalan untuk mereka.
    jenjang.length
      ? supabase.from('curriculum_topic_groups').select('subject_id').in('grade_level', jenjang)
      : Promise.resolve({ data: null }),
    // Soal dan kemajuan DI JENJANG ITU SAJA (migrasi 125).
    jenjang.length
      ? supabase.rpc('practice_progress', {
          p_access_code: TANPA_KODE,
          p_learner_id: learnerId,
          p_grade_levels: jenjang,
        })
      : Promise.resolve({ data: null, error: null }),
    supabase.rpc('practice_progress', { p_access_code: TANPA_KODE, p_learner_id: learnerId }),
  ])

  const kelasIni = new Set(
    ((kelompokKelas as { subject_id: string }[] | null) ?? []).map(r => r.subject_id)
  )
  type Kemajuan = { subject_id: string; answered: number; total: number }
  const petakan = (rows: unknown) =>
    new Map<string, { answered: number; total: number }>(
      ((rows as Kemajuan[] | null) ?? []).map(r => [
        r.subject_id,
        { answered: Number(r.answered), total: Number(r.total) },
      ])
    )
  const progresKelas = petakan(mapelKelas)
  const progresSemua = petakan(mapelSemua)
  // Yang menentukan ADA-TIDAKNYA JAWABAN dari fungsinya, bukan banyaknya baris.
  // Nol baris adalah jawaban yang sah — sebuah jenjang bisa saja benar-benar
  // belum punya satu soal pun di mapel mana pun — dan menyamakannya dengan
  // kegagalan berarti angka seluruh jenjang muncul kembali persis di keadaan
  // yang paling butuh angka kelasnya.
  const pakaiKelas = jenjang.length > 0 && !galatKelas

  const gabungan = new Map<string, MapelLatihan>()
  const baru = (subjectId: string, nama: string, questionCount: number): MapelLatihan => ({
    subject_id: subjectId,
    subject_name: nama,
    question_count: questionCount,
    materi_count: 0,
    video_count: 0,
    answered_count: galatSemua ? null : (progresSemua.get(subjectId)?.answered ?? 0),
    di_kelas: kelasIni.has(subjectId),
    kelas: pakaiKelas
      ? {
          question_count: progresKelas.get(subjectId)?.total ?? 0,
          materi_count: 0,
          video_count: 0,
          answered_count: progresKelas.get(subjectId)?.answered ?? 0,
        }
      : null,
  })

  for (const m of (bersoal as { subject_id: string; subject_name: string; question_count: number }[] | null) ?? []) {
    gabungan.set(m.subject_id, baru(m.subject_id, m.subject_name, m.question_count))
  }
  for (const r of (materi as Materi[] | null) ?? []) {
    const video = adalahVideo(r.link_url)
    // Mapel yang belum punya soal sama sekali. Namanya diambil dari relasi, dan
    // baris tanpa nama dilewati — mapel tanpa nama tidak bisa ditawarkan.
    let ada = gabungan.get(r.subject_id)
    if (!ada) {
      if (!r.subjects?.name) continue
      ada = baru(r.subject_id, r.subjects.name, 0)
      gabungan.set(r.subject_id, ada)
    }
    if (video) ada.video_count++
    else ada.materi_count++
    if (ada.kelas && jenjang.includes(r.grade_level)) {
      if (video) ada.kelas.video_count++
      else ada.kelas.materi_count++
    }
  }

  return [...gabungan.values()].sort((a, b) => a.subject_name.localeCompare(b.subject_name, 'id'))
}

type Materi = {
  subject_id: string
  grade_level: string
  link_url: string
  subjects: { name: string } | null
}

/**
 * Kemajuan satu topik. DUA hal yang berbeda, dan keduanya perlu:
 *
 * - CAKUPAN (`answered`/`total`) — berapa soal dari berapa. Ini yang pantas
 *   digambar sebagai bilah kemajuan.
 * - PENGUASAAN (`score`/`max_available`) — nilai atas SELURUH soal topik, yang
 *   belum dikerjakan terhitung belum dikuasai. Ini yang pantas jadi persen dan
 *   diberi label rubrik.
 *
 * Menukar keduanya menghasilkan kalimat yang tidak bisa dipertanggungjawabkan:
 * satu soal benar dari tiga bukan "Istimewa 100%".
 */
export interface KemajuanTopik {
  group_id: string
  /** Soal BERBEDA yang sudah pernah dijawab. */
  answered: number
  /** Soal yang tersedia di topik itu untuk pelajar ini. */
  total: number
  /** Nilai jawaban TERAKHIR tiap soal, dijumlahkan. */
  score: number
  /** Bobot maksimum soal-soal yang SUDAH dijawab — bukan penyebut penguasaan. */
  max_score: number
  /** Bobot SELURUH soal topik: penyebut penguasaan (migrasi 129). */
  max_available: number
  /** Nilai jawaban PERTAMA tiap soal — untuk menyebutkan kenaikannya. */
  first_score: number
  /** Soal yang jawaban terakhirnya bernilai penuh (migrasi 130). */
  correct: number
  /** Dapat sebagian — `statement_grid` dan `mcq_multi` memang bisa begitu. */
  partial: number
  /** Jawaban terakhirnya bernilai nol. */
  wrong: number
  /** Banyaknya paket di topik ini — soalnya dibagi sepuluh-sepuluh (migrasi 134). */
  paket_total: number
  /**
   * Paket yang sudah TUNTAS: benar semua, atau kuncinya sudah dibuka. Keduanya
   * berarti tidak ada lagi yang bisa dikerjakan di sana, dan itulah yang jadi
   * ukuran seberapa banyak topik ini sudah benar-benar dihadapi.
   */
  paket_tuntas: number
  /**
   * Di antara yang tuntas, yang tuntas karena BENAR SEMUA (migrasi 135).
   * Selisihnya terhadap `paket_tuntas` adalah paket yang berhenti karena
   * kuncinya dibuka — dua keadaan yang layak digambar berbeda.
   */
  paket_sempurna: number
}

/**
 * Kemajuan per topik (migrasi 128) — satu-satunya sumber angka "sudah sampai
 * mana" di seluruh repo ini.
 *
 * Dipakai daftar topik di `/belajar` DAN halaman Penguasaan di portal keluarga,
 * dan itu memang tujuannya: sebelum ini halaman Penguasaan menghitung sendiri
 * dari `practice_answers`, dengan aturan yang berbeda tanpa ada yang berniat
 * membedakannya — ia menjumlah SELURUH jawaban seumur hidup, termasuk tiap
 * pengulangan, sementara daftar topik memakai jawaban terakhir per soal. Dua
 * angka penguasaan untuk topik yang sama, di dua layar yang dibuka orang yang
 * sama pada hari yang sama.
 *
 * `null` berarti kuerinya GAGAL, dan itu berbeda dari daftar kosong: yang
 * pertama artinya kemajuannya tidak diketahui, yang kedua artinya memang belum
 * ada yang dikerjakan. Pemanggilnya menampilkan keduanya dengan cara berbeda.
 *
 * Tanpa `subjectId`, seluruh mapel ikut — itu yang dibutuhkan halaman
 * Penguasaan, yang tidak bertanya tentang satu mapel.
 */
export async function kemajuanTopik(
  learnerId: string,
  subjectId?: string
): Promise<KemajuanTopik[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_topic_progress', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
    p_subject_id: subjectId ?? null,
  })
  if (error) {
    console.error('[belajar] gagal membaca kemajuan topik:', error)
    return null
  }
  type Baris = {
    group_id: string
    answered: number
    total: number
    score: number
    max_score: number
    max_available: number
    first_score: number
    correct: number
    partial: number
    wrong: number
    paket_total: number | null
    paket_tuntas: number | null
    paket_sempurna: number | null
  }
  return ((data as Baris[] | null) ?? []).map(r => ({
    group_id: r.group_id,
    answered: Number(r.answered),
    total: Number(r.total),
    score: Number(r.score),
    max_score: Number(r.max_score),
    // `?? 0` bukan kelebihan hati-hati: sampai migrasi 129 dijalankan, fungsinya
    // memulangkan bentuk lama tanpa kedua kolom ini, dan `Number(undefined)`
    // adalah NaN yang menular ke setiap perhitungan sesudahnya. Nol berarti
    // "penyebutnya tidak diketahui", dan pemanggilnya memang tidak menghitung
    // persen dari penyebut nol.
    max_available: Number(r.max_available ?? 0),
    first_score: Number(r.first_score ?? 0),
    correct: Number(r.correct ?? 0),
    partial: Number(r.partial ?? 0),
    wrong: Number(r.wrong ?? 0),
    paket_total: Number(r.paket_total ?? 0),
    paket_tuntas: Number(r.paket_tuntas ?? 0),
    paket_sempurna: Number(r.paket_sempurna ?? 0),
  }))
}

/**
 * Topik satu mapel, DIURUTKAN SEPERTI DI KURIKULUM.
 *
 * `practice_topics()` mengurutkan menurut abjad tema lalu abjad topik —
 * `curriculum_topic_groups` (migrasi 060) memang tidak menyimpan urutan sama
 * sekali. Urutan yang disusun admin, lengkap dengan tombol naik-turunnya,
 * tinggal di `curriculum_topics.sort_order`, dan tidak pernah ikut ke permukaan
 * belajar. Akibatnya bab pengantar IPA ("Hakikat Sains") jatuh ke urutan
 * keempat karena huruf H, dan Matematika membuka dengan FPB/KPK padahal
 * materinya dibangun dari penjumlahan lebih dulu. Untuk anak yang belajar
 * sendiri, urutan bukan kerapian — ia bagian dari bahannya.
 *
 * Penyusunannya dikerjakan di sini, bukan dengan mengubah `practice_topics()`:
 * fungsi itu dipakai bersama repo `form` (Sora). Disiplin yang sama dengan 092,
 * 110, 122, dan 125.
 *
 * `sort_order` dibaca lewat client sesi seperti yang lain, jadi yang memutuskan
 * tetap RLS — keluarga sejak 076, pelanggan langganan sejak 126. Kalau
 * kuerinya tidak mengembalikan apa-apa, urutannya jatuh kembali ke urutan RPC
 * apa adanya: daftar yang urutannya kurang pas masih jauh lebih baik daripada
 * daftar yang kosong.
 */
export async function topikLatihan(
  learnerId: string,
  subjectId: string
): Promise<TopikLatihan[]> {
  const supabase = await createClient()
  // Kemajuannya diambil BERSAMAAN, bukan sesudah daftarnya datang: ia cuma
  // butuh id mapel, jadi menunggu daftar topik selesai hanya menambah satu
  // perjalanan yang tidak perlu ke waktu tunggu anak.
  const [{ data }, kemajuan] = await Promise.all([
    supabase.rpc('practice_topics', {
      p_access_code: TANPA_KODE,
      p_subject_id: subjectId,
      p_learner_id: learnerId,
    }),
    kemajuanTopik(learnerId, subjectId),
  ])
  const mentah = (data as BarisTopik[] | null) ?? []
  if (mentah.length === 0) return []

  const perTopik = new Map((kemajuan ?? []).map(k => [k.group_id, k]))
  // Kuerinya gagal (null) berarti SELURUH baris tidak tahu kemajuannya — bukan
  // nol. Nol baris tetap jawaban yang sah: pelajar yang belum pernah menjawab
  // apa-apa memang tidak punya satu baris pun di sana.
  const topik: TopikLatihan[] = mentah.map(t => {
    const k = perTopik.get(t.group_id)
    return {
      ...t,
      answered_count: kemajuan === null ? null : (k?.answered ?? 0),
      score: k?.score ?? 0,
      max_score: k?.max_score ?? 0,
      max_available: k?.max_available ?? 0,
      first_score: k?.first_score ?? 0,
      correct: k?.correct ?? 0,
      partial: k?.partial ?? 0,
      wrong: k?.wrong ?? 0,
      paket_total: k?.paket_total ?? 0,
      paket_tuntas: k?.paket_tuntas ?? 0,
      paket_sempurna: k?.paket_sempurna ?? 0,
    }
  })

  const { data: urutan } = await supabase
    .from('curriculum_topics')
    .select('group_id, sort_order')
    .in('group_id', topik.map(t => t.group_id))

  // Satu topik adalah SEKUMPULAN baris CP yang berbagi kunci yang sama (lihat
  // 060), jadi urutannya diambil dari baris paling awal — itu tempat topiknya
  // muncul pertama kali di kurikulum.
  const paling = new Map<string, number>()
  for (const r of (urutan as { group_id: string | null; sort_order: number | null }[] | null) ?? []) {
    if (!r.group_id || r.sort_order == null) continue
    const ada = paling.get(r.group_id)
    if (ada == null || r.sort_order < ada) paling.set(r.group_id, r.sort_order)
  }
  if (paling.size === 0) return topik

  // Jenjang dan semester tetap kunci utama: `sort_order` berulang dari nol di
  // tiap jenjang (Kelas 7 memakai 0-22, Kelas 8 memakai 1-20), jadi mengurutkan
  // dengan angka itu saja akan menyelang-nyeling kelas. Yang tidak punya urutan
  // ditaruh di belakang, BUKAN dibuang, dan di antara mereka urutan RPC-nya
  // dipertahankan (`sort` di JS stabil).
  const kelas = (t: TopikLatihan) => {
    const i = ALL_GRADES.indexOf(t.grade_level)
    return i === -1 ? ALL_GRADES.length : i
  }
  const urut = (t: TopikLatihan) => paling.get(t.group_id) ?? Number.MAX_SAFE_INTEGER
  return [...topik].sort(
    (a, b) => kelas(a) - kelas(b) || a.semester - b.semester || urut(a) - urut(b)
  )
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

/** Keadaan satu paket: isinya tetap, nilainya berjalan (migrasi 134). */
export interface PaketTopik {
  /** Nomor paket di topik itu, mulai 1. */
  nomor: number
  /** Berapa soal di paket ini — sepuluh, kecuali paket terakhir. */
  total: number
  benar: number
  sebagian: number
  salah: number
  /** Belum pernah dijawab di putaran yang selesai. */
  belum: number
  skor: number
  maks: number
  /** Sudah berapa kali paket ini dikerjakan sampai tuntas satu putaran. */
  putaran: number
  /** Kuncinya sudah dibuka, jadi paket ini tidak bisa dikerjakan lagi. */
  terkunci: boolean
}

/** Soal yang masih salah di sebuah paket — yang akan diberikan putaran berikutnya. */
export function sisaPaket(p: PaketTopik): number {
  return p.total - p.benar
}

/** Paket ini sudah habis urusannya: benar semua, atau terkunci. */
export function paketTuntas(p: PaketTopik): boolean {
  return p.terkunci || p.benar >= p.total
}

/**
 * Keadaan seluruh paket sebuah topik, urut dari Paket 1.
 *
 * Daftar kosong berarti topiknya tidak punya soal yang bisa dinilai otomatis —
 * bukan galat, dan layarnya mengatakannya dengan kalimat.
 */
export async function keadaanPaket(learnerId: string, groupId: string): Promise<PaketTopik[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_paket_state', {
    p_group_id: groupId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membaca keadaan paket:', error)
    return []
  }
  type Baris = {
    paket_index: number
    total: number
    benar: number
    sebagian: number
    salah: number
    belum: number
    skor: number | string
    maks: number | string
    putaran: number
    terkunci: boolean | null
  }
  return ((data as Baris[] | null) ?? []).map(r => ({
    nomor: Number(r.paket_index),
    total: Number(r.total),
    benar: Number(r.benar),
    sebagian: Number(r.sebagian),
    salah: Number(r.salah),
    belum: Number(r.belum),
    skor: Number(r.skor ?? 0),
    maks: Number(r.maks ?? 0),
    putaran: Number(r.putaran ?? 0),
    terkunci: !!r.terkunci,
  }))
}

/** Satu soal beserta tempatnya di paket: paket keberapa, urutan keberapa. */
export interface IsiPaket {
  nomorPaket: number
  itemId: string
  /** Urutan soal di dalam paketnya, 1..10. */
  ord: number
}

/**
 * Isi tiap paket sebuah topik — soal mana masuk paket mana.
 *
 * Dipakai layar yang perlu menggambar SOAL-SOALNYA, bukan cuma cacahnya:
 * rincian topik menggambar sepuluh petak bernomor per paket, dan nomor itu
 * harus nomor paketnya (1..10 yang tetap), bukan urutan di sebuah putaran yang
 * isinya cuma sisa soal yang masih salah.
 */
export async function isiPaket(learnerId: string, groupId: string): Promise<IsiPaket[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_paket_items', {
    p_group_id: groupId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membaca isi paket:', error)
    return []
  }
  return (
    (data as { paket_index: number; item_id: string; ord: number }[] | null) ?? []
  ).map(r => ({
    nomorPaket: Number(r.paket_index),
    itemId: r.item_id,
    ord: Number(r.ord),
  }))
}

/**
 * Membuka satu putaran sebuah paket. Isinya soal paket itu yang MASIH salah —
 * putaran pertama otomatis memuat semuanya.
 *
 * Null berarti tidak bisa dibuka, dan sebabnya sengaja tidak dibedakan di sini:
 * terkunci, sudah benar semua, atau bukan miliknya. Ketiganya berakhir sama di
 * layar, dan membedakannya berarti mengabarkan keadaan paket milik orang lain
 * kepada yang bertanya.
 */
export async function bukaPaket(
  learnerId: string,
  groupId: string,
  nomor: number
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_open_paket_session', {
    p_group_id: groupId,
    p_paket_index: nomor,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membuka paket:', error)
    return null
  }
  return (data as string | null) ?? null
}

/** Menandai kunci sebuah paket sudah dibuka — sesudah ini ia tidak bisa dikerjakan lagi. */
export async function kunciPaket(
  learnerId: string,
  groupId: string,
  nomor: number
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_lock_paket', {
    p_group_id: groupId,
    p_paket_index: nomor,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal mengunci paket:', error)
    return false
  }
  return data === true
}

/** Paket mana yang sedang dikerjakan sebuah sesi. Null untuk sesi sebelum paket ada. */
export async function paketSesi(
  sesiId: string
): Promise<{ groupId: string; nomor: number } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('practice_sessions')
    .select('paket_group_id, paket_index')
    .eq('id', sesiId)
    .maybeSingle()
  const r = data as { paket_group_id: string | null; paket_index: number | null } | null
  if (!r?.paket_group_id || r.paket_index == null) return null
  return { groupId: r.paket_group_id, nomor: Number(r.paket_index) }
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
      sudahDijawab: baris.answered,
      benar: baris.is_correct,
      skor: baris.score === null ? null : Number(baris.score),
      skorMaks: baris.max_score === null ? null : Number(baris.max_score),
    }))
}

/**
 * Daftar soal sebuah sesi yang SUDAH SELESAI, lengkap dengan jawaban anaknya,
 * kuncinya, dan pembahasannya.
 *
 * Daftar kosong berarti sesinya bukan milik pemanggil ATAU belum selesai —
 * keduanya dijaga `practice_session_review()` (migrasi 131), bukan di sini.
 * Syarat "sudah selesai" itulah yang membuat kunci jawaban di sini bukan
 * kebocoran: sesi yang masih berjalan tidak punya jalan menuju fungsi ini.
 *
 * Nomornya `ord`, posisi soal di undian sesi — nomor yang sama dengan "Soal 4
 * dari 10" saat mengerjakannya dan dengan petak bernomor di rincian topik.
 */
export async function tinjauanSesi(sesiId: string): Promise<SoalTinjauan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('practice_session_review', {
    p_session_id: sesiId,
    p_access_code: TANPA_KODE,
  })
  if (error) {
    console.error('[belajar] gagal membaca tinjauan sesi:', error)
    return []
  }

  return ((data as BarisTinjauanSesi[] | null) ?? [])
    // Alasannya sama dengan `keadaanSesi`: sesi lama bisa memuat tipe yang
    // tidak punya bentuk jawaban di permukaan ini.
    .filter(baris => !TIPE_TANPA_NILAI_OTOMATIS.includes(baris.type))
    .map(baris => ({
      id: baris.item_id,
      nomor: baris.ord,
      tipe: baris.type,
      prompt: baris.prompt,
      opsi: baris.options,
      bobot: Number(baris.weight) || 1,
      jawaban: baris.response,
      kunci: baris.correct_answer,
      pembahasan: baris.explanation,
      sudahDijawab: baris.answered,
      skor: baris.score === null ? null : Number(baris.score),
      skorMaks: baris.max_score === null ? null : Number(baris.max_score),
    }))
}

/**
 * Menilai satu jawaban lalu mencatatnya.
 *
 * Penilaiannya TIDAK lagi terjadi di sini. Sejak migrasi 137,
 * `practice_record_answer()` membaca kuncinya sendiri dan menghitung sendiri
 * lewat `nilai_jawaban()` — satu-satunya definisi aturan skoring, dipakai
 * bersama oleh Tera dan Sora yang tidak berbagi paket npm, hanya database ini.
 *
 * Dua akibat yang disengaja. Pertama, kunci jawabannya tidak pernah lagi keluar
 * dari database untuk keperluan menilai. Kedua, skornya tidak bisa dikarang
 * pemanggil: sebelumnya fungsi itu menerima angka jadi, dan siapa pun yang
 * memegang anon key bisa menuliskan nilai sempurna untuk sesinya sendiri tanpa
 * menjawab apa pun.
 *
 * Satu perjalanan, bukan dua: pembahasannya ikut pulang bersama skornya.
 */
/**
 * Jejak pengerjaan satu butir, dari browser (FR3 & FR6).
 *
 * Ketiganya boleh kosong: sesi lama, dan permukaan mana pun yang belum
 * mengirimkannya, tetap bisa mencatat jawaban. Yang hilang cuma angka waktunya
 * — bukan jawabannya.
 */
export interface JejakButir {
  /** Kapan butir ini mulai terlihat. Jam browser; database menolak yang mustahil. */
  waktuMulai?: string
  /** Lama halaman tidak terlihat selagi butir ini terbuka, milidetik. */
  jedaMs?: number
  /** Urutan opsi seperti yang dilihat anaknya. Jejak saja — penilaian membandingkan teks. */
  urutanOpsi?: string[]
}

export async function jawabSoal(
  sesiId: string,
  itemId: string,
  jawaban: unknown,
  jejak: JejakButir = {}
): Promise<HasilJawab | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('practice_record_answer', {
    p_session_id: sesiId,
    p_item_id: itemId,
    p_response: jawaban ?? null,
    p_access_code: TANPA_KODE,
    p_waktu_mulai: jejak.waktuMulai ?? null,
    p_jeda_ms: jejak.jedaMs ?? null,
    p_urutan_opsi: jejak.urutanOpsi ?? null,
  })
  if (error) {
    console.error('[belajar] gagal mencatat jawaban:', error)
    return null
  }

  // Nol baris berarti fungsinya menolak: sesinya bukan milik orang ini, soalnya
  // tidak diundi untuk sesi ini, atau tipenya tidak bisa dinilai mesin. Ketiganya
  // sama-sama "tidak tercatat", dan tidak satu pun boleh terbaca sebagai nol.
  const hasil = (data as BarisJawabTercatat[] | null)?.[0]
  if (!hasil) return null

  return {
    benar: hasil.benar,
    skor: Number(hasil.skor),
    skorMaks: Number(hasil.skor_maks),
    pembahasan: hasil.pembahasan,
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

