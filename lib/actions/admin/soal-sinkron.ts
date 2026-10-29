'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { getDriveClient, getFormsClient } from '@/lib/google-drive'
import { sinkronkanSoalDigital, type HasilSinkronSoal, type PetaSoal } from '@/lib/soal-digital-sinkron'
import peta from '@/lib/soal-pemetaan.json'

export type HasilTombolSoal = { error: string } | { hasil: HasilSinkronSoal }

/**
 * Tombol "Buat soal digital dari Drive sekarang" di halaman Materi dan Soal.
 *
 * Menjalankan yang sama dengan tugas harian (`/api/cron/sinkron-soal`): membaca
 * Google Form baru/berubah di Drive lalu membuat kuis draf di Sora dan butir
 * bank soal draf untuk menu Belajar. Memproses paling banyak 40 form per
 * tekan; sisanya mengantre. Tidak menyentuh jurnal tutor dan tidak menulis ke Drive.
 */
export async function sinkronkanSoalSekarang(): Promise<HasilTombolSoal> {
  const user = await getUser()
  if (!user) return { error: 'Tidak diizinkan' }
  const admin = createAdminClient()
  const { data: profil } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profil?.role !== 'admin') return { error: 'Tidak diizinkan' }

  try {
    const hasil = await sinkronkanSoalDigital({
      db: admin,
      drive: getDriveClient(),
      forms: getFormsClient(),
      peta: peta as PetaSoal[],
      tulis: true,
    })
    revalidatePath('/admin/materi-latihan-soal')
    return { hasil }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sinkronisasi gagal' }
  }
}
