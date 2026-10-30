import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Akun keluarga (role `parent`) dan email teknis untuk profil siswa.
 *
 * Sejak migrasi 076 yang bisa login ke portal hanyalah akun `parent`; profil
 * `student` cuma catatan. Setiap profil tetap butuh satu baris di Supabase Auth
 * (`profiles.id` menunjuk ke `auth.users`), dan satu email hanya boleh dipakai
 * satu akun. Jadi profil siswa memakai email teknis yang tidak pernah dipakai
 * login, supaya alamat sungguhan yang diketik admin bisa dipakai akun keluarga.
 */

/** Alamat unik untuk profil siswa. Subdomain `siswa.` tidak punya kotak surat. */
export function emailTeknisSiswa(): string {
  return `siswa-${crypto.randomUUID().slice(0, 12)}@siswa.bimbeltera.com`
}

export function adalahEmailTeknis(email: string | null | undefined): boolean {
  return !!email && /^siswa-[0-9a-f-]+@siswa\.bimbeltera\.com$/i.test(email)
}

/**
 * Membuat akun keluarga. Pengembaliannya id akun, atau `{ error }` yang sudah
 * dalam bahasa admin — bukan pesan mentah Supabase.
 */
export async function buatAkunKeluarga(
  admin: SupabaseClient,
  { email, password, nama, phone }: { email: string; password: string; nama: string; phone?: string | null }
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nama, role: 'parent' },
  })
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return { error: 'Email itu sudah dipakai akun lain. Pilih akun orang tua yang sudah ada di kolom "Tautkan ke akun orang tua", atau pakai email lain.' }
    }
    return { error: error.message }
  }
  const update: Record<string, string> = { role: 'parent', full_name: nama, updated_at: new Date().toISOString() }
  if (phone) update.phone = phone
  await admin.from('profiles').update(update).eq('id', data.user.id)
  return { id: data.user.id }
}
