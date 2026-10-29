import { createAdminClient } from '@/lib/supabase/server-admin'
import { getDriveClient, getFormsClient } from '@/lib/google-drive'
import { sinkronkanSoalDigital, type PetaSoal } from '@/lib/soal-digital-sinkron'
import peta from '@/lib/soal-pemetaan.json'

/**
 * Tugas harian: membuat soal digital dari Google Form baru/berubah di Drive,
 * kembaran `/api/cron/sinkron-materi`. Hasilnya draf (kuis Sora + butir bank
 * soal bertag topik) — tidak menyentuh jurnal tutor. Lihat
 * `lib/soal-digital-sinkron.ts` untuk aturannya.
 *
 * Dipanggil Vercel Cron (`vercel.json`) dengan `Authorization: Bearer
 * $CRON_SECRET`; tanpa `CRON_SECRET` menolak semuanya karena rute ini menulis.
 * Memproses paling banyak 40 form per putaran; sisanya mengantre ke hari
 * berikutnya.
 */
export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const rahasia = process.env.CRON_SECRET
  if (!rahasia) return Response.json({ error: 'CRON_SECRET belum diatur' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${rahasia}`) {
    return Response.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }

  try {
    const hasil = await sinkronkanSoalDigital({
      db: createAdminClient(),
      drive: getDriveClient(),
      forms: getFormsClient(),
      peta: peta as PetaSoal[],
      tulis: true,
    })
    return Response.json({
      ok: true,
      formDrive: hasil.formDrive,
      dibuat: hasil.dibuat,
      diperbarui: hasil.diperbarui,
      butirBaru: hasil.butirBaru,
      antrean: hasil.antrean,
      tanpaTopik: hasil.tanpaTopik.length,
      dilewati: hasil.dilewati.length,
      perluTinjauan: hasil.perluTinjauan.length,
      galat: hasil.galat.length,
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Sinkronisasi gagal' }, { status: 500 })
  }
}
