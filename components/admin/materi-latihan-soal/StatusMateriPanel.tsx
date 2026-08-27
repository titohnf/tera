interface Props {
  terbaca: number
  menungguAkses: number
  tautanLuar: number
}

/**
 * Berapa banyak materi yang benar-benar bisa dibaca anak di dalam halaman.
 *
 * Menggantikan panel "Sinkronisasi ke Google Drive" yang dulu berdiri di sini.
 * Panel itu menawarkan tombol yang menyalin berkas materi ke folder Drive
 * bimbel — pekerjaan yang sudah tidak ada gunanya sejak materi disajikan dari
 * penyimpanan Tera sendiri (migrasi 120), dan yang di produksi tidak pernah
 * sekali pun berhasil karena kredensial Google-nya memang tidak pernah dipasang
 * di sana. Tombol yang menjanjikan pekerjaan yang salah, lalu gagal
 * mengerjakannya, adalah dua kekeliruan sekaligus.
 *
 * Yang menggantikannya tidak punya tombol, dan itu disengaja. Pemindahan materi
 * dijalankan dari `scripts/materi-ke-penyimpanan.mjs` di mesin yang punya kunci
 * service account — bukan dari server, yang tidak punya dan tidak perlu punya
 * kunci itu. Yang berguna di layar ini bukan tombolnya melainkan angkanya:
 * "berapa materi yang masih menunggu tutornya membuka akses" adalah daftar
 * kerja yang nyata, dan sebelumnya tidak terlihat dari mana pun.
 */
export default function StatusMateriPanel({ terbaca, menungguAkses, tautanLuar }: Props) {
  const total = terbaca + menungguAkses + tautanLuar
  if (total === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-gray-700">Materi yang bisa dibaca di dalam halaman</p>
      <p className="text-xs text-gray-500 mt-0.5">
        <span className="text-green-600 font-medium">{terbaca} dari {total}</span> tersimpan di Tera dan terbaca langsung di `/belajar`
        {menungguAkses > 0 && (
          <>
            {' · '}
            <span className="text-amber-600 font-medium">{menungguAkses} menunggu tutornya membuka akses</span>
          </>
        )}
        {tautanLuar > 0 && (
          <>{' · '}{tautanLuar} tautan luar (folder Drive, Google Form, situs lain) yang memang tidak bisa disemat</>
        )}
      </p>
      {menungguAkses > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Yang menunggu akses tetap tersemat, tapi anak yang membukanya melihat layar
          &ldquo;Anda memerlukan akses&rdquo; — bukan materinya. Setelah tutornya membuka,
          jalankan <code className="text-gray-500">scripts/materi-ke-penyimpanan.mjs</code>.
        </p>
      )}
    </div>
  )
}
