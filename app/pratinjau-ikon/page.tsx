import KartuAplikasi from '@/components/apps/KartuAplikasi'
import Ikon3D, { type NamaIkon3D } from '@/components/ui/Ikon3D'

/**
 * SEMENTARA — pratinjau perbandingan ikon menu beranda siswa: opsi 1 warna asli,
 * opsi 2 warna custom (biru + kuning). Hapus halaman ini setelah pilihan diputuskan.
 */
export const metadata = { title: 'Pratinjau ikon menu' }

const OPSI: { judul: string; catatan: string; ikon: [NamaIkon3D, NamaIkon3D, NamaIkon3D, NamaIkon3D] }[] = [
  {
    judul: 'Opsi 1 — Warna asli',
    catatan: 'Ikon Fluent Emoji apa adanya: memo oranye, roket merah muda, controller ungu, piala emas.',
    ikon: ['memo', 'rocket', 'video-game', 'trophy'],
  },
  {
    judul: 'Opsi 2 — Custom biru + kuning',
    catatan: 'Memo, controller, dan piala diwarnai ke satu tangga biru dan kuning. Roket tetap asli, hanya merahnya jadi biru.',
    ikon: ['memo-bk', 'rocket-biru', 'video-game-bk', 'trophy-bk'],
  },
]

const MENU = [
  { nama: 'Latihan Soal', teks: 'Soal per topik dengan pembahasan.' },
  { nama: 'Misi', teks: 'Naik level, kumpulkan bintangnya.' },
  { nama: 'Materi', teks: 'Belajar konsep secara interaktif.' },
  { nama: 'Try Out', teks: 'Uji kemampuanmu lewat try out TKA.' },
]

export default function PratinjauIkon() {
  return (
    <div className="tampilan-siswa min-h-screen bg-slate-100">
      <main className="mx-auto max-w-md space-y-8 px-4 py-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pratinjau ikon menu</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Bandingkan dua opsi, lalu pilih satu.</p>
        </div>

        {OPSI.map((o) => (
          <section key={o.judul} className="space-y-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{o.judul}</h2>
              <p className="text-sm font-medium text-slate-500">{o.catatan}</p>
            </div>

            {/* Berdampingan, besar: untuk menilai warna. */}
            <div className="grid grid-cols-4 gap-2 rounded-2xl border-2 border-b-4 border-slate-200 border-b-slate-300 bg-white p-3">
              {o.ikon.map((n, i) => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <Ikon3D nama={n} ukuran={64} />
                  <span className="text-[11px] font-bold text-slate-500">{MENU[i].nama}</span>
                </div>
              ))}
            </div>

            {/* Di latar hero (biru Tera). */}
            <div className="flex items-center justify-between rounded-2xl bg-tera p-4 text-white">
              <span className="text-lg font-extrabold">Di latar hero</span>
              <span className="flex gap-3">
                {o.ikon.map((n) => (
                  <Ikon3D key={n} nama={n} ukuran={44} />
                ))}
              </span>
            </div>

            {/* Seperti di beranda. */}
            <div className="space-y-3">
              {MENU.map((m, i) => (
                <KartuAplikasi key={m.nama} nama={m.nama} teks={m.teks} href="#" satuBaris ikon={o.ikon[i]} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
