'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { getDriveClient } from '@/lib/google-drive'
import { sinkronkanMateri, type HasilSinkron, type Pemetaan } from '@/lib/materi-pemetaan'
import peta from '@/lib/materi-pemetaan.json'

export type HasilTombolSinkron = { error: string } | { hasil: HasilSinkron }

/**
 * Tombol "Sinkronkan dengan Drive sekarang" di halaman Materi dan Soal.
 *
 * Menjalankan yang sama dengan `scripts/sinkron-materi-drive.mjs --tulis` dan
 * tugas harian (`/api/cron/sinkron-materi`): daftarkan berkas Drive yang cocok
 * ke katalog, lalu tandai mana yang siap dibaca anak. Hanya mendaftarkan yang
 * cocok pasti (kode, peta manual, atau nama persis) — yang tidak, dikembalikan
 * sebagai daftar untuk diputuskan admin. Tidak menulis ke Drive.
 */
export async function sinkronkanMateriSekarang(): Promise<HasilTombolSinkron> {
  const user = await getUser()
  if (!user) return { error: 'Tidak diizinkan' }
  const admin = createAdminClient()
  const { data: profil } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profil?.role !== 'admin') return { error: 'Tidak diizinkan' }

  try {
    const hasil = await sinkronkanMateri({ db: admin, drive: getDriveClient(), peta: peta as Pemetaan[], tulis: true })
    revalidatePath('/admin/materi-latihan-soal')
    return { hasil }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sinkronisasi gagal' }
  }
}
