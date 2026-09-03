import { createClient } from '@/lib/supabase/server'

/**
 * Tes penempatan (Dokumen Fondasi Bagian 3.1): pengukuran singkat sebelum
 * sebuah topik dimulai, supaya anak yang sudah menguasai C1–C2 tidak dipaksa
 * mengerjakannya.
 *
 * Berkas sendiri dengan alasan yang sama seperti `retest.ts`: yang di sana
 * jalur MEMBUKTIKAN ULANG, yang di sini jalur MENEMPATKAN. Keduanya kebetulan
 * memakai mesin sesi yang sama, dan kebetulan bukan alasan menyatukan berkas.
 *
 * Seluruh aturannya ada di database (migrasi 173) — berapa butir, kapan boleh
 * dibuka, dan level mana yang dibebaskan. Yang di sini cuma pemanggilnya.
 */

const TANPA_KODE = ''

/** Topik yang sedang ditempatkan sebuah sesi, atau null kalau bukan sesi penempatan. */
export interface PenempatanSesi {
  topikId: string
  nama: string
}

/**
 * Apakah sebuah sesi adalah tes penempatan — dan kalau ya, topik apa.
 *
 * Dipakai dua layar untuk MENGURANGI pilihan, persis seperti `probeSesi`: tes
 * penempatan tidak menawarkan "kerjakan lagi soal yang salah" maupun "lihat
 * kunci". Yang pertama akan mengubah penempatan jadi latihan sampai lolos —
 * dan yang diukur di sini justru kemampuan SEBELUM latihan. Yang kedua
 * membocorkan butir yang beberapa menit lagi mungkin muncul lagi.
 */
export async function penempatanSesi(sesiId: string): Promise<PenempatanSesi | null> {
  const supabase = await createClient()
  // Dua kueri, bukan penyematan PostgREST, dengan alasan yang sama seperti di
  // `probeSesi`: penyematan menuntut nama constraint FK sebagai petunjuk, dan
  // nama itu dibangkitkan Postgres.
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('penempatan_topik_id')
    .eq('id', sesiId)
    .maybeSingle()
  if (error || !data) return null

  const topikId = data.penempatan_topik_id as string | null
  if (!topikId) return null

  const { data: topik } = await supabase
    .from('topik')
    .select('nama')
    .eq('id', topikId)
    .maybeSingle()

  return { topikId, nama: (topik?.nama as string) ?? topikId }
}

/** Membuka sesi tes penempatan sebuah topik. Null berarti belum/tidak boleh. */
export async function bukaPenempatan(
  learnerId: string,
  topikId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('penempatan_buka_sesi', {
    p_topik_id: topikId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membuka tes penempatan:', error)
    return null
  }
  return (data as string | null) ?? null
}
