import { createClient } from '@/lib/supabase/server'

/**
 * Kesiapan peta kompetensi untuk murid sebuah sesi kelas.
 *
 * Dibaca lewat klien SESI, bukan service role, meski halaman sesi memakai
 * service role untuk sisa datanya. Gerbang `topik_kesiapan_sesi()` (151)
 * bersandar pada `auth.uid()`, dan service role tidak punya satu pun — lewat
 * klien admin, fungsi itu akan pulang kosong dan kartunya menghilang tanpa
 * alasan yang kelihatan.
 *
 * Tidak ada Skor Putaran 1 di sini, dan itu bukan kelalaian: lihat catatan
 * migrasi 151. Tutor kelas melihat sejauh mana muridnya berjalan; angka
 * diagnostiknya milik penanggung jawab pengukuran.
 */
export interface KesiapanMurid {
  profileId: string
  nama: string
  topikId: string
  topikNama: string
  paketLatihanSelesai: number
  paketLatihanTotal: number
  /** Level Bloom tertinggi yang paketnya pernah diselesaikan; null kalau belum ada. */
  levelTertinggi: number | null
  /** 0–1, skor paket ujian topik ini. Null kalau belum dikerjakan. */
  skorUjian: number | null
}

interface Baris {
  profile_id: string
  nama: string
  topik_id: string
  topik_nama: string
  paket_latihan_selesai: number | string
  paket_latihan_total: number | string
  level_tertinggi: number | null
  skor_ujian: number | string | null
}

export async function kesiapanTopikSesi(
  sessionId: string,
  profileIds: string[]
): Promise<KesiapanMurid[]> {
  if (profileIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_kesiapan_sesi', {
    p_session_id: sessionId,
    p_profile_ids: profileIds,
  })

  if (error) {
    // Sengaja tidak melempar: kartunya tambahan pada halaman yang sudah penuh
    // pekerjaan wajib, dan sesi yang topiknya tidak terpetakan ke peta mana pun
    // adalah keadaan normal, bukan kegagalan.
    console.error('[pengukuran] gagal memuat kesiapan topik:', error)
    return []
  }

  return ((data as Baris[] | null) ?? []).map(b => ({
    profileId: b.profile_id,
    nama: b.nama,
    topikId: b.topik_id,
    topikNama: b.topik_nama,
    paketLatihanSelesai: Number(b.paket_latihan_selesai ?? 0),
    paketLatihanTotal: Number(b.paket_latihan_total ?? 0),
    levelTertinggi: b.level_tertinggi,
    skorUjian: b.skor_ujian === null || b.skor_ujian === undefined ? null : Number(b.skor_ujian),
  }))
}
