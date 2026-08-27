import { createClient } from '@/lib/supabase/server'
import { adalahVideo } from './sematan'
import { extractDriveFileId } from '@/lib/curriculum-resource-links'
import { ALL_GRADES } from '@/lib/curriculum-config'
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

export interface SesiTertunda {
  sesiId: string
  jumlahSoal: number
  sudahDijawab: number
  /** Semua soalnya sudah dijawab; yang tersisa cuma membuka hasilnya. */
  tinggalHasil: boolean
}

/**
 * Sesi yang ditinggalkan di tengah jalan, kalau ada.
 *
 * Tanpa ini, kemampuan melanjutkan sesi yang dibangun migrasi 114 TIDAK BISA
 * DIJANGKAU: rute sesi tidak ditautkan dari mana pun, jadi satu-satunya jalan
 * kembali adalah alamat yang kebetulan masih tersimpan di riwayat peramban.
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
 */
export async function sesiTertunda(learnerId: string): Promise<SesiTertunda | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('practice_sessions')
    .select('id, item_ids')
    .eq('learner_id', learnerId)
    .is('finished_at', null)
    .order('started_at', { ascending: false })
    .limit(10)

  const kandidat = ((data as { id: string; item_ids: string[] | null }[] | null) ?? []).filter(
    r => (r.item_ids?.length ?? 0) > 0
  )
  if (kandidat.length === 0) return null

  // Satu kueri untuk semua kandidat, bukan satu per sesi: jumlahnya kecil, tapi
  // "satu kueri per baris di layar" adalah kebiasaan yang mahalnya baru terasa
  // setelah terlambat.
  const { data: jawaban } = await supabase
    .from('practice_answers')
    .select('session_id')
    .in(
      'session_id',
      kandidat.map(k => k.id)
    )

  const terjawab = new Map<string, number>()
  for (const baris of (jawaban as { session_id: string }[] | null) ?? []) {
    terjawab.set(baris.session_id, (terjawab.get(baris.session_id) ?? 0) + 1)
  }

  const sesi = kandidat.find(k => (terjawab.get(k.id) ?? 0) > 0)
  if (!sesi) return null

  const jumlahSoal = sesi.item_ids!.length
  const sudahDijawab = terjawab.get(sesi.id) ?? 0

  return {
    sesiId: sesi.id,
    jumlahSoal,
    sudahDijawab,
    tinggalHasil: sudahDijawab >= jumlahSoal,
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
    { data: salinan },
    { data: kelompokKelas },
    { data: mapelKelas, error: galatKelas },
    { data: mapelSemua, error: galatSemua },
  ] = await Promise.all([
    supabase.rpc('practice_subjects', { p_access_code: TANPA_KODE, p_learner_id: learnerId }),
    supabase
      .from('curriculum_resources')
      .select('subject_id, grade_level, link_url, subjects(name)')
      .eq('kind', 'materi'),
    // Materi mana yang PDF-nya sudah ada di penyimpanan Tera. Yang belum tidak
    // ikut dihitung — ukuran yang sama dengan `materiTopik()`, dan itu yang
    // membuat angka di kartu mapel sama dengan isi yang terbuka di dalamnya.
    supabase.from('curriculum_resource_duplications').select('drive_file_id, pdf_path'),
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
  // Materi yang belum bisa dibaca anak tidak dihitung sama sekali — lihat
  // `materiTopik()`. Video tidak lewat penyimpanan Tera dan karena itu tidak
  // diukur dengan ukuran ini: yang menentukan keterbacaannya YouTube, bukan
  // kita, dan tautannya memang bisa langsung dibuka.
  const adaPdf = new Set(
    ((salinan as { drive_file_id: string; pdf_path: string | null }[] | null) ?? [])
      .filter(s => s.pdf_path)
      .map(s => s.drive_file_id)
  )
  const terbaca = (url: string) => {
    const id = extractDriveFileId(url)
    return !!id && adaPdf.has(id)
  }

  for (const r of (materi as Materi[] | null) ?? []) {
    const video = adalahVideo(r.link_url)
    if (!video && !terbaca(r.link_url)) continue
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
  const { data } = await supabase.rpc('practice_topics', {
    p_access_code: TANPA_KODE,
    p_subject_id: subjectId,
    p_learner_id: learnerId,
  })
  const topik = (data as TopikLatihan[] | null) ?? []
  if (topik.length === 0) return topik

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
