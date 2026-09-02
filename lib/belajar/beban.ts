import { createClient } from '@/lib/supabase/server'

/**
 * Beban belajar harian (FR10): kapan sistem sebaiknya menyarankan berhenti.
 *
 * TIDAK PERNAH MEMBLOKIR. Seluruh berkas ini tidak punya satu pun jalan untuk
 * menolak membuka sesi — yang paling jauh bisa dilakukannya adalah membawa satu
 * kalimat ke layar, dan kalimat itu selalu berdampingan dengan tombol lanjut
 * yang dihormati (dokumen fondasi Bagian 3.2).
 */

const TANPA_KODE = ''

export interface NudgeBeban {
  sinyal:
    | 'paket_per_hari'
    | 'menit_per_hari'
    | 'performa_menurun'
    | 'menyerah_meningkat'
  pesan: string
  /** 1 atau 2. Sesudah yang kedua, tidak ada lagi untuk sisa hari itu. */
  nudgeKe: number
}

/**
 * Nudge formal yang pantas ditampilkan sesudah sebuah sesi, atau null.
 *
 * Null jauh lebih sering, dan itu memang tujuannya: batas dua per hari
 * ditegakkan di dalam fungsi database, jadi anak yang sudah dua kali menolak
 * tidak ditegur lagi sampai besok — bukan ditegur dengan kalimat yang sama,
 * dan bukan pula dengan kalimat yang lebih memaksa.
 */
export async function nudgeBeban(
  learnerId: string,
  sesiId: string,
): Promise<NudgeBeban | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('beban_belajar', {
    p_sesi_id: sesiId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal membaca beban belajar:', error)
    return null
  }
  const baris = (data as { sinyal: string; pesan: string; nudge_ke: number }[] | null)?.[0]
  if (!baris) return null
  return {
    sinyal: baris.sinyal as NudgeBeban['sinyal'],
    pesan: baris.pesan,
    nudgeKe: Number(baris.nudge_ke),
  }
}

/**
 * Ambang nudge RINGAN dalam menit — durasi kerja tanpa jeda.
 *
 * Dibaca dari `pengaturan`, bukan ditanam di komponen browser: ia satu-satunya
 * ambang FR10 yang punya rujukan riset langsung (rentang atensi siswa SMP
 * 10-12 menit), dan justru karena itu ia perlu bisa diubah tim konten tanpa
 * deploy saat rujukan itu diperbarui.
 */
export async function menitTanpaJeda(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pengaturan')
    .select('nilai')
    .eq('kunci', 'beban_menit_tanpa_jeda')
    .maybeSingle()
  const nilai = Number((data as { nilai: unknown } | null)?.nilai)
  return Number.isFinite(nilai) && nilai > 0 ? nilai : 12
}
