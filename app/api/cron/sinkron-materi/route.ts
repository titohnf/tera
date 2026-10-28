import { createAdminClient } from '@/lib/supabase/server-admin'
import { getDriveClient } from '@/lib/google-drive'
import { sinkronkanMateri, type Pemetaan } from '@/lib/materi-pemetaan'
import peta from '@/lib/materi-pemetaan.json'

/**
 * Tugas harian: menyamakan katalog materi dengan folder "Materi Kurikulum" di
 * Drive, tanpa menunggu ada yang ingat menjalankan skripnya.
 *
 * Dipanggil Vercel Cron (lihat `vercel.json`), yang mengirim
 * `Authorization: Bearer $CRON_SECRET`. Tanpa `CRON_SECRET` rute ini menolak
 * semuanya — lebih baik tidak berjalan daripada terbuka untuk siapa saja yang
 * menebak alamatnya, karena ia menulis ke katalog.
 *
 * Yang dikerjakan sama dengan tombol di halaman admin: hanya yang cocok pasti
 * yang didaftarkan, lalu keterbacaan ditandai ulang (berkas yang hilang berhenti
 * dijanjikan). Yang tidak cocok dikembalikan di respons dan tampil di panel admin
 * sebagai daftar kerja.
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
    const hasil = await sinkronkanMateri({
      db: createAdminClient(),
      drive: getDriveClient(),
      peta: peta as Pemetaan[],
      tulis: true,
    })
    return Response.json({
      ok: true,
      berkasDrive: hasil.berkasDrive,
      didaftarkan: hasil.baru.length,
      tanpaCocok: hasil.tanpaCocok.length,
      siapDibaca: hasil.pindai.siap,
      berhentiSiap: hasil.pindai.padam,
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Sinkronisasi gagal' }, { status: 500 })
  }
}
