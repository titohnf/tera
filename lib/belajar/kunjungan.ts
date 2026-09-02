import { createClient } from '@/lib/supabase/server'

/**
 * Kunjungan kembali (FR12): sudah berapa lama, dan apa yang pantas dikatakan.
 *
 * TIDAK ADA STREAK di sini, dan itu keputusan yang ditulis dua kali di dokumen
 * fondasi: streak yang terputus terasa seperti hukuman, dan anak yang merasa
 * dihukum karena absen tiga hari punya satu alasan lagi untuk tidak kembali di
 * hari keempat. Yang diketahui berkas ini cuma jarak dari kunjungan terakhir.
 */

const TANPA_KODE = ''

/**
 * Menstempel kunjungan dan mengembalikan jarak hari dari kunjungan SEBELUMNYA.
 *
 * Null berarti murid ini belum pernah datang — dan itu berbeda dari nol,
 * meski keduanya berakhir tanpa sapaan.
 *
 * Menulis, jadi ia tidak boleh dipanggil dari layar yang cuma melaporkan.
 * Tempatnya permukaan tempat anak MENDARAT; memanggilnya dari halaman rapor
 * orang tua akan membuat kunjungan orang tua terhitung sebagai kunjungan
 * anaknya, dan sapaan "sudah seminggu" tidak pernah muncul untuk anak yang
 * memang belum datang seminggu.
 */
export async function catatKunjungan(learnerId: string): Promise<number | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('catat_kunjungan', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[belajar] gagal mencatat kunjungan:', error)
    return null
  }
  return (data as number | null) ?? null
}

export interface Sapaan {
  teks: string
  /** Jeda cukup panjang untuk menawarkan pemanasan (≥14 hari). */
  tawarkanPemanasan: boolean
}

/**
 * Sapaan untuk jarak kunjungan tertentu — lima tingkatan, Alur Kunjungan
 * Kembali Bagian 3.
 *
 * Null berarti tidak ada yang perlu dikatakan: kunjungan pertama, atau anak
 * yang memang sudah membukanya hari ini juga. Sapaan "selamat datang lagi"
 * untuk orang yang baru saja menutup tab adalah sapaan yang terbaca sebagai
 * layar yang lupa.
 *
 * Tidak satu pun dari kalimat di bawah menegur. Itu syarat, bukan gaya: yang
 * dituju adalah anak yang absen dua minggu dan sedang memutuskan apakah akan
 * membukanya lagi besok.
 *
 * Ambangnya (0, 1-2, 3-6, 7-13, ≥14) default operasional yang masuk akal,
 * BUKAN hasil kalibrasi — dokumen itu sendiri menandainya begitu, dan ia perlu
 * ditinjau ulang begitu ada data pola kunjungan nyata.
 */
export function sapaanKunjungan(hari: number | null): Sapaan | null {
  if (hari == null || hari === 0) return null
  if (hari <= 2) return { teks: 'Selamat datang lagi!', tawarkanPemanasan: false }
  if (hari <= 6) {
    return {
      teks: 'Sudah beberapa hari nih! Yuk lanjut, dikit lagi kok.',
      tawarkanPemanasan: false,
    }
  }
  return {
    teks: 'Sudah seminggu lebih nih! Nggak apa-apa, yuk mulai lagi pelan-pelan.',
    tawarkanPemanasan: hari >= 14,
  }
}
