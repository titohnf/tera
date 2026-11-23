import KartuAplikasi from '@/components/apps/KartuAplikasi'
import Ikon3D, { type NamaIkon3D } from '@/components/ui/Ikon3D'

/**
 * SEMENTARA — pratinjau pilihan ikon MATERI (layar 360°). Hapus halaman ini dan
 * berkas ikon yang kalah setelah pilihan diputuskan.
 */
export const metadata = { title: 'Pratinjau ikon Materi' }

const PILIHAN: { huruf: string; nama: string; catatan: string; ikon: NamaIkon3D }[] = [
  { huruf: 'A', nama: 'Tanpa panel (sekarang)', catatan: 'Layar melengkung, sisi kiri-kanan digelapkan halus.', ikon: 'layar-360' },
  { huruf: 'B', nama: 'Tanpa panel, lengkung lebih dalam', catatan: 'Sama seperti A, tepi atas dan bawah lebih melengkung.', ikon: 'layar-360-dalam' },
  { huruf: 'C', nama: 'Panel abu-abu', catatan: 'Dua panel samping berwarna abu-abu kebiruan.', ikon: 'layar-360-abu' },
  { huruf: 'D', nama: 'Panel biru (sebelumnya)', catatan: 'Dua panel samping berwarna biru logo.', ikon: 'layar-360-biru' },
]

export default function PratinjauIkon() {
  return (
    <div className="tampilan-siswa min-h-screen bg-slate-100">
      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pilih ikon Materi</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Sebutkan hurufnya.</p>
        </div>

        <div className="grid grid-cols-4 gap-3 rounded-2xl border-2 border-b-4 border-slate-200 border-b-slate-300 bg-white p-4">
          {PILIHAN.map((p) => (
            <div key={p.huruf} className="flex flex-col items-center gap-1">
              <Ikon3D nama={p.ikon} ukuran={72} />
              <span className="text-sm font-extrabold text-slate-700">{p.huruf}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {PILIHAN.map((p) => (
            <div key={p.huruf}>
              <p className="mb-1 text-xs font-bold text-slate-500">
                {p.huruf}. {p.nama} — {p.catatan}
              </p>
              <div className="space-y-2">
                <KartuAplikasi nama="Misi" teks="Naik level, kumpulkan bintangnya." href="#" satuBaris ikon="rocket-biru" />
                <KartuAplikasi nama="Materi" teks="Belajar konsep secara interaktif." href="#" satuBaris ikon={p.ikon} />
                <KartuAplikasi nama="Try Out" teks="Uji kemampuanmu lewat try out TKA." href="#" satuBaris ikon="trophy-bk" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
