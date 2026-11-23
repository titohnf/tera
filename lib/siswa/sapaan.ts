import { createAdminClient } from '@/lib/supabase/server-admin'

/** Sapaan menurut jam WIB: pagi (4–10), siang (11–14), sore (15–17), malam (selebihnya). */
export function sapaanWaktu(sekarang: Date = new Date()): string {
  const jam = Number(sekarang.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' })) % 24
  if (jam >= 4 && jam <= 10) return 'Selamat pagi'
  if (jam >= 11 && jam <= 14) return 'Selamat siang'
  if (jam >= 15 && jam <= 17) return 'Selamat sore'
  return 'Selamat malam'
}

/**
 * Kelas siswa sebagai teks ("Kelas 5"), atau null bila belum diisi atau gagal dibaca. Satu kueri kecil;
 * pemanggil harus sudah memastikan `studentId` milik pengguna (`anakOrRedirect`).
 */
export async function kelasAnak(studentId: string): Promise<string | null> {
  try {
    const { data } = await createAdminClient().from('profiles').select('grade').eq('id', studentId).maybeSingle()
    const k = (data as { grade: number | null } | null)?.grade
    return typeof k === 'number' ? `Kelas ${k}` : null
  } catch {
    return null
  }
}
