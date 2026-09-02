import { createClient } from '@/lib/supabase/server'

/**
 * Retest terjadwal (FR11): pembuktian ulang penguasaan sebuah topik.
 *
 * Berkas sendiri, bukan tambahan di `topik-peta.ts`, dengan alasan yang sama
 * seperti pemisahan `topik-rapor.ts`: yang di sana adalah jalur MENGERJAKAN
 * paket, yang di sini jalur MEMBUKTIKAN ULANG. Keduanya kebetulan memakai mesin
 * sesi yang sama, dan kebetulan bukan alasan untuk menyatukan berkas.
 *
 * Seluruh aturannya — kapan jatuh tempo, butir mana yang dirotasi, apa yang
 * terjadi saat gagal — ada di database (migrasi 164). Yang di sini cuma
 * pemanggilnya.
 */

const TANPA_KODE = ''

/** Satu topik yang sudah waktunya dibuktikan ulang. */
export interface RetestJatuhTempo {
  topikId: string
  nama: string
  tanggal: string
  /**
   * Verifikasi yang dipicu kegagalan retest sebuah prasyarat — ia mengabaikan
   * jadwal normal karena sifatnya mendesak (Retest Terjadwal Bagian 5.1).
   */
  mendesak: boolean
}

export async function retestJatuhTempo(learnerId: string): Promise<RetestJatuhTempo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('retest_jatuh_tempo', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membaca jadwal retest:', error)
    return []
  }
  return ((data as {
    topik_id: string
    nama: string
    tanggal_retest_berikutnya: string
    mendesak: boolean
  }[] | null) ?? []).map(b => ({
    topikId: b.topik_id,
    nama: b.nama,
    tanggal: b.tanggal_retest_berikutnya,
    mendesak: b.mendesak,
  }))
}

/** Topik yang sedang diprobe sebuah sesi, atau null kalau sesi itu bukan probe. */
export interface ProbeSesi {
  topikId: string
  nama: string
}

/**
 * Apakah sebuah sesi adalah sesi probe — dan kalau ya, topik apa.
 *
 * Dipakai dua layar untuk MENGURANGI pilihan, bukan menambah: sesi probe tidak
 * boleh menawarkan "kerjakan lagi soal yang salah" maupun "lihat kunci". Tanpa
 * jawaban dari sini, halaman hasil akan memperlakukannya seperti sesi tanpa
 * paket — yaitu sesi warisan yang kuncinya memang terbuka — dan seluruh kolam
 * probe sebuah topik bocor dalam sekali duduk.
 */
export async function probeSesi(sesiId: string): Promise<ProbeSesi | null> {
  const supabase = await createClient()
  // Dua kueri, bukan satu dengan penyematan PostgREST: penyematan menuntut nama
  // constraint FK sebagai petunjuk, dan nama itu dibangkitkan Postgres — sesuatu
  // yang bisa berbeda antara pangkalan yang dimigrasi berurutan dan yang
  // dipulihkan dari cadangan. Kueri kedua hanya berjalan untuk sesi probe, yang
  // jumlahnya segelintir.
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('probe_topik_id')
    .eq('id', sesiId)
    .maybeSingle()
  if (error || !data) return null

  const topikId = (data as { probe_topik_id: string | null }).probe_topik_id
  if (!topikId) return null

  const { data: topik } = await supabase
    .from('topik')
    .select('nama')
    .eq('id', topikId)
    .maybeSingle()

  return { topikId, nama: (topik as { nama: string } | null)?.nama ?? topikId }
}
