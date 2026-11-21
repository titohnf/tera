import { LencanaF } from '@/components/belajar/misi/KonsepLencana2'

export default function Page() {
  return (
    <div className="space-y-4 bg-slate-100 p-6 pb-10">
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(k => (
          <div key={k} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 pb-5">
            <div className="p-3">
              <LencanaF kelas={k} ukuran={96} />
            </div>
            <div className="flex items-center gap-1.5">
              <LencanaF kelas={k} ukuran={32} />
              <span className="text-[11px] font-bold">Kelas {k}</span>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-sm font-bold">Tidak aktif (abu)</h2>
      <div className="grid grid-cols-6 gap-3">
        {[1, 4, 6, 7, 9, 12].map(k => (
          <div key={k} className="flex flex-col items-center rounded-2xl bg-white p-4 pb-5">
            <div className="p-3">
              <LencanaF kelas={k} ukuran={96} aktif={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
