import { createClient } from '@/lib/supabase/server'

/**
 * Langkah berikutnya sebuah topik — jalur alur Misi (migrasi 190).
 *
 * Berkas sendiri, bukan tambahan di `topik-peta.ts`, dengan alasan yang sama
 * seperti pemisahan `retest.ts`: yang di sana jalur MENGERJAKAN sebuah paket
 * yang sudah dipilih, yang di sini jalur MEMILIHKANNYA. Keduanya memakai mesin
 * paket yang sama, dan kesamaan itu bukan alasan menyatukan berkasnya.
 *
 * Seluruh aturannya di database. Yang di sini cuma pemanggilnya — dan itu
 * disengaja: tiga permukaan memakai jawaban ini (kartu topik, halaman transisi,
 * tombol "Lanjut" di layar hasil), dan aturan yang disalin ke TypeScript akan
 * menjadi aturan keempat yang diam-diam berbeda.
 */

const TANPA_KODE = ''

export interface LangkahTopik {
  topikId: string
  /** Null berarti tidak ada langkah tersisa: wajibnya lolos, ujiannya sudah. */
  paketId: string | null
  jenis: 'latihan' | 'ujian' | null
  levelBloom: number | null
  /** Topik ini pernah punya sesi yang selesai — kunjungan pertama atau bukan. */
  sudahMulai: boolean
  terkunci: boolean
  bukaPada: string | null
  /**
   * Paket langkahnya sendiri sudah pernah dikerjakan sampai selesai (191).
   *
   * Inilah yang membedakan "lanjut" dari "ulangi": langkah yang menunjuk paket
   * yang baru saja ditutup anak berarti paketnya belum lolos ambang.
   */
  pernahDikerjakan: boolean
}

interface BarisLangkah {
  topik_id: string
  paket_id: string | null
  jenis: string | null
  level_bloom: number | null
  sudah_mulai: boolean | null
  terkunci: boolean | null
  buka_pada: string | null
  pernah_dikerjakan: boolean | null
}

function dariBaris(b: BarisLangkah): LangkahTopik {
  return {
    topikId: b.topik_id,
    paketId: b.paket_id,
    jenis: b.jenis === 'ujian' ? 'ujian' : b.jenis === 'latihan' ? 'latihan' : null,
    levelBloom: b.level_bloom == null ? null : Number(b.level_bloom),
    sudahMulai: Boolean(b.sudah_mulai),
    terkunci: Boolean(b.terkunci),
    bukaPada: b.buka_pada ?? null,
    pernahDikerjakan: Boolean(b.pernah_dikerjakan),
  }
}

/** Langkah berikutnya untuk SELURUH topik aktif, sekali jalan. */
export async function langkahSeluruhTopik(learnerId: string): Promise<LangkahTopik[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_langkah_berikutnya', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
    p_topik_id: null,
  })
  if (error) {
    // Peta tetap digambar tanpa langkahnya — daftar topik yang kehilangan
    // indikator masih bisa dipakai, sedangkan halaman kosong tidak.
    console.error('[misi] gagal membaca langkah berikutnya:', error)
    return []
  }
  return ((data as BarisLangkah[] | null) ?? []).map(dariBaris)
}

/** Langkah berikutnya satu topik. Null berarti topiknya tidak ada atau tidak aktif. */
export async function langkahTopik(
  learnerId: string,
  topikId: string
): Promise<LangkahTopik | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_langkah_berikutnya', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
    p_topik_id: topikId,
  })
  if (error) {
    console.error('[misi] gagal membaca langkah topik:', error)
    return null
  }
  const baris = (data as BarisLangkah[] | null) ?? []
  return baris.length ? dariBaris(baris[0]) : null
}
