import { headers } from 'next/headers'

/**
 * Pembatas percobaan salah di login kode, per alamat IP.
 *
 * Sejak kode siswa bimbel membuka akun keluarga mereka, menebak kode berarti menebak
 * kata sandi. Ruang kodenya 31^6 (sekitar 887 juta) dengan puluhan kode sah, jadi menebak
 * lewat internet nyaris mustahil, dan pembatas ini menambah lapisan: sesudah 8 tebakan salah
 * dalam 10 menit, IP itu ditolak sampai jendelanya lewat. Disimpan di memori instance
 * (tanpa tabel baru), jadi ia hanya pembatas sebisanya: instance serverless yang berbeda
 * punya hitungan sendiri. Pembatas yang mutlak butuh tabel di database (migrasi).
 */
const JENDELA_MS = 10 * 60 * 1000
const MAKS_SALAH = 8
const salah = new Map<string, number[]>()

async function ip(): Promise<string> {
  const h = await headers()
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'tak-dikenal'
}

export async function terlaluBanyakSalah(): Promise<boolean> {
  const k = await ip()
  const sekarang = Date.now()
  const baru = (salah.get(k) ?? []).filter((t) => sekarang - t < JENDELA_MS)
  salah.set(k, baru)
  return baru.length >= MAKS_SALAH
}

export async function catatSalah(): Promise<void> {
  const k = await ip()
  salah.set(k, [...(salah.get(k) ?? []), Date.now()])
  // Tebakan salah juga dilambatkan sedikit.
  await new Promise((r) => setTimeout(r, 400))
}
