import { createAdminClient } from '@/lib/supabase/server-admin'

// Tanpa 0/O, 1/I/L: kode diketik anak dari kertas atau pesan WhatsApp.
const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const buatKode = () => Array.from({ length: 6 }, () => ALFABET[Math.floor(Math.random() * ALFABET.length)]).join('')

/**
 * Kode try out seorang siswa bimbel, dibuatkan bila belum ada (dan baris `learners`-nya
 * juga). Dipakai halaman Try Out di beranda keluarga untuk membawa anak ke Sora
 * (`?kode=`) tanpa mengetik apa pun. Pemanggil WAJIB sudah memastikan orang yang login
 * berhak atas anak ini (`anakOrRedirect`).
 */
export async function kodeAnak(studentId: string): Promise<{ learnerId: string; kode: string } | null> {
  const admin = createAdminClient()
  const { data: ada } = await admin.from('learners').select('id, access_code').eq('profile_id', studentId).maybeSingle()
  const baris = ada as { id: string; access_code: string | null } | null
  if (baris?.access_code) return { learnerId: baris.id, kode: baris.access_code }
  const { data: profil } = await admin.from('profiles').select('full_name').eq('id', studentId).single()
  const nama = (profil as { full_name: string | null } | null)?.full_name ?? 'Murid'
  for (let percobaan = 0; percobaan < 6; percobaan++) {
    const kode = buatKode()
    if (baris) {
      const { error } = await admin.from('learners').update({ access_code: kode }).eq('id', baris.id).is('access_code', null)
      if (!error) return { learnerId: baris.id, kode }
      if (!error.message.includes('learners_access_code_key')) return null
    } else {
      const { data, error } = await admin.from('learners').insert({ profile_id: studentId, name: nama, access_code: kode }).select('id').single()
      if (!error && data) return { learnerId: (data as { id: string }).id, kode }
      if (error && !error.message.includes('learners_access_code_key')) return null
    }
  }
  return null
}
