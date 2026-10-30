import type { SupabaseClient } from '@supabase/supabase-js'
import { nomorWhatsApp, pesanAksesPortal, tautanWhatsApp } from '@/lib/pesan-keluarga'

/**
 * Menyiapkan tautan WhatsApp "akses portal" untuk satu siswa: dikirim ke nomor
 * orang tua, berisi email login keluarga dan password default.
 *
 * Dihitung di server karena passwordnya dibaca dari lingkungan
 * (`PASSWORD_DEFAULT_RESET`); halaman yang memakainya hanya bisa dibuka admin.
 * Bila bahannya kurang, `href` null dan `alasan` menyebut apa yang kurang.
 */
export async function siapkanWaAkses(
  admin: SupabaseClient,
  studentId: string
): Promise<{ href: string | null; alasan: string | null; terkirimPada: string | null }> {
  const { data: siswa } = await admin
    .from('profiles')
    .select('full_name, nickname, parent_name, parent_phone, akses_dikirim_at')
    .eq('id', studentId)
    .maybeSingle()
  const { data: tautan } = await admin.from('family_students').select('family_id').eq('student_id', studentId)
  const ids = (tautan ?? []).map(t => t.family_id as string)
  const { data: akun } = ids.length
    ? await admin.from('profiles').select('full_name, email, phone').in('id', ids)
    : { data: [] as { full_name: string | null; email: string | null; phone: string | null }[] }

  const akunLogin = (akun ?? []).find(a => a.email)
  const nomor = nomorWhatsApp(siswa?.parent_phone || akunLogin?.phone)
  const passwordDefault = process.env.PASSWORD_DEFAULT_RESET

  const terkirimPada = (siswa?.akses_dikirim_at as string | null) ?? null
  if (!akunLogin) return { href: null, alasan: 'Belum ada akun login keluarga untuk siswa ini', terkirimPada }
  if (!nomor) return { href: null, alasan: 'Nomor orang tua belum diisi', terkirimPada }
  if (!passwordDefault) return { href: null, alasan: 'Password default belum diatur di server', terkirimPada }

  return {
    href: tautanWhatsApp(
      nomor,
      pesanAksesPortal({
        namaAnak: siswa?.nickname || siswa?.full_name || 'putra/putri Bapak/Ibu',
        namaOrtu: siswa?.parent_name || akunLogin.full_name,
        email: akunLogin.email as string,
        password: passwordDefault,
      })
    ),
    alasan: null,
    terkirimPada,
  }
}
