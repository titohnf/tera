import { createClient } from '@/lib/supabase/server'

/**
 * Apakah sesi ini dibuat lewat "masuk dengan kode" (siswa), bukan email dan password (orang tua)?
 *
 * Masuk dengan kode membuat sesi di akun keluarga lewat tautan sekali pakai (`verifyOtp`), sedangkan
 * orang tua masuk dengan password. Token sesi mencatat caranya di klaim `amr` — ditandatangani
 * Supabase, jadi tidak bisa diubah dari peramban. Tampilan keluarga hanya untuk yang masuk dengan
 * password; sesi berkode dialihkan ke tampilan siswa (`/siswa/<anak>`).
 *
 * Ini pemisahan tampilan, BUKAN pemisahan peran: akun dan izin database-nya tetap akun keluarga.
 * Gagal dengan aman: bila klaimnya tidak terbaca atau namanya tidak cocok, hasilnya false dan tidak ada
 * yang dialihkan (sama dengan keadaan sebelum pagar ini ada).
 */
export async function sesiMasukDenganKode(): Promise<boolean> {
  try {
    const { data } = await (await createClient()).auth.getClaims()
    const amr = (data?.claims as { amr?: { method?: string }[] } | undefined)?.amr
    const metode = (amr ?? []).map((a) => a.method)
    return !metode.includes('password') && (metode.includes('otp') || metode.includes('magiclink'))
  } catch {
    return false
  }
}
