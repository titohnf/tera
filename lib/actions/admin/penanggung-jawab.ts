'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type ActionState = { error: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

/**
 * Menetapkan tutor penanggung jawab seorang siswa (PRD FR9).
 *
 * Bukan "tutor yang mengajarnya". Relasi tutor–murid yang sudah ada di Tera
 * semuanya lewat kelas (`classes.tutor_id`, `sessions.tutor_id`) dan menjawab
 * pertanyaan berbeda — siapa yang mengajar pertemuan ini — serta bisa berganti
 * tiap minggu. Yang dibutuhkan eskalasi adalah satu nama yang tetap: kepada
 * siapa sistem mengadu ketika seorang anak dua kali berturut-turut kesulitan
 * (migrasi tera 139 Bagian 1).
 *
 * Wajib terisi sebelum murid bisa membuka paket pengukuran — ditegakkan
 * trigger di database (migrasi 149), bukan oleh layar ini. Jadi mengosongkan
 * kembali penanggung jawab bukan tindakan tanpa akibat: murid itu langsung
 * tidak bisa memulai paket berikutnya.
 *
 * Kolomnya hidup di `learners`, dan baris itu baru dibuat otomatis saat akun
 * keluarga pertama kali membuka latihan (migrasi 092). Siswa yang belum pernah
 * dibuka latihannya belum punya baris, jadi dibuat di sini.
 */
export async function setPenanggungJawabSiswa(
  studentId: string,
  tutorId: string | null,
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  if (tutorId) {
    const { data: tutor } = await ctx.admin
      .from('profiles')
      .select('role')
      .eq('id', tutorId)
      .single()
    // Peran diperiksa di sini karena kolomnya sendiri tidak bisa memeriksanya:
    // FK-nya menunjuk `profiles`, yang memuat admin dan murid juga.
    if (tutor?.role !== 'tutor' && tutor?.role !== 'admin') {
      return { error: 'Penanggung jawab harus tutor atau admin' }
    }
  }

  const { data: siswa } = await ctx.admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', studentId)
    .single()
  if (!siswa || siswa.role !== 'student') return { error: 'Siswa tidak ditemukan' }

  const { data: learner } = await ctx.admin
    .from('learners')
    .select('id')
    .eq('profile_id', studentId)
    .maybeSingle()

  const { error } = learner
    ? await ctx.admin
        .from('learners')
        .update({ tutor_penanggung_jawab_id: tutorId })
        .eq('id', learner.id)
    : await ctx.admin.from('learners').insert({
        profile_id: studentId,
        name: (siswa.full_name as string | null) ?? 'Murid',
        tutor_penanggung_jawab_id: tutorId,
      })

  if (error) return { error: error.message }
  revalidatePath(`/admin/siswa/${studentId}`)
  return null
}
