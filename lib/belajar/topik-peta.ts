import { createClient } from '@/lib/supabase/server'

/**
 * Jalur peta kompetensi — kembaran `sesi.ts` yang berkunci topik, bukan grup
 * kurikulum.
 *
 * Kenapa berkas sendiri dan bukan cabang di dalam `sesi.ts`: berkas itu sudah
 * memikul seluruh jalur grup, dan menambahkan mode kedua di dalamnya berarti
 * tiap fungsi harus menjawab "ini yang mana" sebelum menjawab pertanyaannya
 * sendiri. Keduanya memang berbeda sampai ke pangkalnya — yang satu bertanya
 * "apa isi bab ini", yang lain "apa yang sudah dikuasai anak ini" — dan
 * kemiripan bentuk keluarannya kebetulan, bukan alasan menyatukannya.
 *
 * Seluruh fungsi di sini memanggil RPC `topik_*` (migrasi 146) yang
 * gerbangnya `practice_actor()` dan `practice_only_public()` di sisi database.
 * Tidak ada keputusan akses yang diambil di berkas ini.
 */

const TANPA_KODE = ''


/** Satu topik di peta, beserta kesiapannya untuk anak ini. */
export interface TopikPeta {
  id: string
  nama: string
  elemen: string
  jenjangKelas: string
  /** Titik lemah nasional: `ekstra` atau `ekstra_wajib`, selain itu `biasa`. */
  penandaRemediasi: string
  jumlahPaket: number
  /**
   * Seluruh prasyaratnya sudah tuntas.
   *
   * MEMBERI TAHU, BUKAN MEMBLOKIR. Tanpa placement test, anak kelas 8 yang
   * belum pernah menyentuh D-02 tidak boleh terkunci dari D-08 hanya karena
   * sistem belum sempat mengukurnya. Layar memakainya untuk menyusun urutan
   * dan memberi keterangan, bukan mematikan tombol.
   */
  prasyaratTerpenuhi: boolean
  prasyaratKurang: string[]
}

/** Satu paket di dalam sebuah topik. */
export interface PaketPeta {
  paketId: string
  jenis: 'latihan' | 'ujian'
  /** Level Bloom paket latihan; null untuk paket ujian, yang mencampur level. */
  levelBloom: number | null
  nomor: number
  total: number
  benar: number
  sebagian: number
  salah: number
  belum: number
  skor: number
  maks: number
  putaran: number
  terkunci: boolean
}

interface BarisTopik {
  topik_id: string
  nama: string
  elemen: string
  jenjang_kelas: string
  penanda_remediasi: string
  jumlah_paket: number | string
  prasyarat_terpenuhi: boolean
  prasyarat_kurang: string[] | null
}

interface BarisPaket {
  paket_id: string
  jenis: 'latihan' | 'ujian'
  level_bloom: number | null
  nomor: number
  jumlah: number | string
  benar: number | string
  sebagian: number | string
  salah: number | string
  belum: number | string
  skor: number | string
  maks: number | string
  putaran: number | string
  terkunci: boolean | null
}

const angka = (n: number | string | null | undefined) => Number(n ?? 0)

/**
 * Topik yang boleh dikerjakan anak ini.
 *
 * Yang pulang hanya topik `aktif` yang punya paket berisi — syarat kedua itu
 * yang mencegah peta menyala sebagai satu kotak berisi dan delapan belas kotak
 * abu-abu, keadaan yang membuat anak mengira aplikasinya rusak padahal isinya
 * memang belum ditulis.
 */
export async function petaTopik(learnerId: string): Promise<TopikPeta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_tersedia', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal memuat topik:', error)
    return []
  }

  return ((data as BarisTopik[] | null) ?? []).map(b => ({
    id: b.topik_id,
    nama: b.nama,
    elemen: b.elemen,
    jenjangKelas: b.jenjang_kelas,
    penandaRemediasi: b.penanda_remediasi,
    jumlahPaket: angka(b.jumlah_paket),
    prasyaratTerpenuhi: b.prasyarat_terpenuhi,
    prasyaratKurang: b.prasyarat_kurang ?? [],
  }))
}

/** Keadaan tiap paket sebuah topik untuk anak ini. */
export async function keadaanPaketTopik(
  learnerId: string,
  topikId: string
): Promise<PaketPeta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_paket_state', {
    p_topik_id: topikId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal memuat paket:', error)
    return []
  }

  return ((data as BarisPaket[] | null) ?? []).map(b => ({
    paketId: b.paket_id,
    jenis: b.jenis,
    levelBloom: b.level_bloom,
    nomor: b.nomor,
    total: angka(b.jumlah),
    benar: angka(b.benar),
    sebagian: angka(b.sebagian),
    salah: angka(b.salah),
    belum: angka(b.belum),
    skor: angka(b.skor),
    maks: angka(b.maks),
    putaran: angka(b.putaran),
    terkunci: Boolean(b.terkunci),
  }))
}

/**
 * Membuka satu putaran sebuah paket. Null berarti tidak bisa dibuka, dan
 * pemanggilnya tidak perlu membedakan sebabnya di layar: paketnya terkunci,
 * sudah benar semua, paket ujian yang sudah pernah dikerjakan, atau bukan
 * miliknya.
 */
export async function bukaPaketTopik(
  learnerId: string,
  paketId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_open_paket_session', {
    p_paket_id: paketId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal membuka paket:', error)
    return null
  }
  return (data as string | null) ?? null
}

/** Membuka kunci jawaban sebuah paket — sesudah ini nilainya berhenti di situ. */
export async function kunciPaketTopik(learnerId: string, paketId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_lock_paket', {
    p_paket_id: paketId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal mengunci paket:', error)
    return false
  }
  return Boolean(data)
}
