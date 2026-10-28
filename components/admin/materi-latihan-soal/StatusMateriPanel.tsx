import SinkronMateriTombol from './SinkronMateriTombol'

interface Props {
  terbaca: number
  menungguAkses: number
  tautanLuar: number
}

/**
 * Berapa banyak materi yang benar-benar bisa dibaca anak di dalam halaman.
 *
 * Menggantikan panel "Sinkronisasi ke Google Drive" yang dulu berdiri di sini,
 * dan tidak punya tombol — itu disengaja. Pendaftaran dan pemindaian materi
 * dijalankan dari skrip di mesin yang punya kunci service account
 * (`sinkron-materi-drive.mjs`, `pindai-materi-drive.mjs`). Yang berguna di
 * layar ini adalah angkanya: berapa materi yang benar-benar terbuka bagi anak,
 * dan berapa yang belum — daftar kerja yang nyata.
 */
export default function StatusMateriPanel({ terbaca, menungguAkses, tautanLuar }: Props) {
  const total = terbaca + menungguAkses + tautanLuar
  if (total === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-gray-700">Materi yang bisa dibaca di dalam halaman</p>
      <p className="text-xs text-gray-500 mt-0.5">
        <span className="text-green-600 font-medium">{terbaca} dari {total}</span> terbaca langsung di `/belajar`
        {menungguAkses > 0 && (
          <>
            {' · '}
            <span className="text-amber-600 font-medium">{menungguAkses} belum bisa dibuka anak</span>
          </>
        )}
        {tautanLuar > 0 && (
          <>{' · '}{tautanLuar} tautan luar (folder Drive, Google Form, situs lain) yang memang tidak bisa disemat</>
        )}
      </p>
      {menungguAkses > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Yang belum bisa dibuka biasanya berkas <code className="text-gray-500">.docx</code> (terunduh,
          bukan tampil di halaman), berkas yang sudah dihapus dari Drive, atau yang baru didaftarkan
          dan belum dipindai. Pindai ulang dengan{' '}
          <code className="text-gray-500">scripts/pindai-materi-drive.mjs</code>; materi baru di Drive
          didaftarkan lewat <code className="text-gray-500">scripts/sinkron-materi-drive.mjs</code>.
        </p>
      )}
      <SinkronMateriTombol otomatis={Boolean(process.env.CRON_SECRET)} />
    </div>
  )
}
