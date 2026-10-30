'use server'

import { createClient } from '@/lib/supabase/server'

type State = { error: string } | { success: string } | null

/**
 * Ganti password akun yang sedang login. Password lama WAJIB benar: ponsel yang
 * masih login tidak cukup untuk mengganti password pemiliknya.
 *
 * Dipakai portal keluarga dan akun mandiri lewat `KartuAkun`. Sengaja tidak
 * menerima id pengguna: yang diganti selalu akun pemilik sesi, jadi tidak ada
 * jalan mengganti password orang lain dari sini. Versi tutor
 * (`changeTutorPassword`) punya aturan panjang minimal 8; di sini 6, sama dengan
 * password awal yang dibuat admin (`createUser`), supaya orang yang dibuatkan
 * password pendek tidak ditolak saat menggantinya.
 */
export async function gantiPassword(_prev: State, formData: FormData): Promise<State> {
  const lama = formData.get('lama')?.toString() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const konfirmasi = formData.get('konfirmasi')?.toString() ?? ''

  if (!lama) return { error: 'Password lama wajib diisi.' }
  if (password.length < 6) return { error: 'Password minimal 6 karakter.' }
  if (password !== konfirmasi) return { error: 'Konfirmasi password tidak cocok.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Sesi berakhir. Masuk lagi lalu coba kembali.' }

  // Memeriksa password lama dengan masuk ulang atas nama akun yang sama. Hasilnya
  // sesi baru untuk orang yang sama, jadi tidak ada yang berpindah akun.
  const { error: galatLama } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: lama,
  })
  if (galatLama) return { error: 'Password lama salah.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (/different|same/i.test(error.message)) {
      return { error: 'Password baru harus berbeda dari password lama.' }
    }
    return { error: 'Password belum bisa diubah. Coba lagi sebentar lagi.' }
  }
  return { success: 'Password berhasil diubah.' }
}
