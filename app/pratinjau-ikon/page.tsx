import KartuAplikasi from '@/components/apps/KartuAplikasi'
import Ikon3D, { type NamaIkon3D } from '@/components/ui/Ikon3D'

/**
 * SEMENTARA — pratinjau pilihan bentuk ikon MATERI di menu beranda siswa. Hapus
 * halaman ini (dan ikon yang kalah) setelah pilihan diputuskan.
 */
export const metadata = { title: 'Pratinjau ikon Materi' }

const KANDIDAT: { no: number; nama: string; catatan: string; ikon: NamaIkon3D }[] = [
  { no: 1, nama: 'Play (sekarang)', catatan: 'Piringan putih, segitiga biru.', ikon: 'play' },
  { no: 2, nama: 'Layar interaktif', catatan: 'Monitor putih dengan layar biru dan play putih.', ikon: 'layar' },
  { no: 3, nama: 'Kartu video', catatan: 'Kartu pelajaran: thumbnail play dan bilah kemajuan kuning.', ikon: 'kartu-video' },
  { no: 4, nama: 'Play biru', catatan: 'Piringan biru pekat, segitiga putih.', ikon: 'play-biru' },
  { no: 5, nama: 'Play kuning', catatan: 'Piringan kuning, segitiga putih.', ikon: 'play-kuning' },
  { no: 6, nama: 'Papan klaker (biru + kuning)', catatan: 'Fluent Emoji, diwarnai.', ikon: 'clapper-bk' },
  { no: 7, nama: 'Papan klaker (warna asli)', catatan: 'Fluent Emoji apa adanya.', ikon: 'clapper' },
  { no: 8, nama: 'Proyektor film (biru + kuning)', catatan: 'Fluent Emoji, diwarnai.', ikon: 'proyektor-bk' },
  { no: 9, nama: 'Proyektor film (warna asli)', catatan: 'Fluent Emoji apa adanya.', ikon: 'proyektor' },
  { no: 10, nama: 'Televisi (biru + kuning)', catatan: 'Fluent Emoji, diwarnai.', ikon: 'tv-bk' },
  { no: 11, nama: 'Televisi (warna asli)', catatan: 'Fluent Emoji apa adanya.', ikon: 'tv' },
  { no: 12, nama: 'Layar bioskop', catatan: 'Layar cekung: ujung kiri-kanan lebih tinggi, play putih, kursi bioskop di depan.', ikon: 'layar-bioskop' },
]

export default function PratinjauIkon() {
  return (
    <div className="tampilan-siswa min-h-screen bg-slate-100">
      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pilih ikon Materi</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Sebutkan nomornya.</p>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-2xl border-2 border-b-4 border-slate-200 border-b-slate-300 bg-white p-3">
          {KANDIDAT.map((k) => (
            <div key={k.no} className="flex flex-col items-center gap-1">
              <Ikon3D nama={k.ikon} ukuran={56} />
              <span className="text-[11px] font-extrabold text-slate-500">{k.no}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {KANDIDAT.map((k) => (
            <div key={k.no}>
              <p className="mb-1 text-xs font-bold text-slate-500">
                {k.no}. {k.nama} — {k.catatan}
              </p>
              <KartuAplikasi nama="Materi" teks="Belajar konsep secara interaktif." href="#" satuBaris ikon={k.ikon} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
