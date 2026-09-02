/**
 * Rangka layar pertama selagi mapelnya dihitung.
 *
 * `mapelLatihan()` menjalankan lima kueri sebelum satu piksel pun bisa
 * digambar — soal, materi, kelompok kelas, dan dua kemajuan — dan tanpa berkas
 * ini seluruh waktu itu berlalu di halaman kosong, sesudah ketukan yang tidak
 * memberi tanda apa pun bahwa ia masuk.
 *
 * Bentuknya SENGAJA menyerupai isi yang akan menggantikannya: sapaan, kotak
 * cari, lalu kartu-kartu mapel. Rangka yang bentuknya berbeda dari isinya
 * membuat layar melompat sekali lagi tepat saat datanya datang.
 */
export default function Memuat() {
  return (
    <div className="space-y-2" aria-busy>
      <span className="sr-only">Memuat daftar mapel…</span>

      <div className="flex items-center gap-3 pb-1">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <div className="h-10 animate-pulse rounded-xl bg-white shadow-kartu" />

      <div className="space-y-2 pt-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
