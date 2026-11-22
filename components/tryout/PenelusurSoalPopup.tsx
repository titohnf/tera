'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { LABEL_HASIL } from '@/components/tryout/hasil-butir'
import { PETAK, PILL, type ItemSoal } from '@/components/tryout/PenelusurSoal'

/**
 * Satu soal per nomor di dalam pop up, berperilaku sama dengan `PenelusurSoal` di halaman hasil try out
 * siswa: petak nomor berwarna menurut hasil (menempel di atas area gulir), satu soal yang tampil, dan
 * tombol Sebelumnya/Berikutnya. Bedanya: tidak menyentuh alamat halaman, dan menggulir isi pop up saja.
 */
export default function PenelusurSoalPopup({ items }: { items: ItemSoal[] }) {
  const [aktif, setAktif] = useState(0)
  const kartu = useRef<HTMLDivElement>(null)

  const pilih = (i: number) => {
    setAktif(i)
    // Bawa pembaca ke awal soal yang baru, bukan membiarkannya di dasar soal sebelumnya.
    kartu.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  if (items.length === 0) return null
  const ini = items[aktif]

  return (
    <div>
      <nav aria-label="Nomor soal" className="sticky top-0 z-10 -mx-4 flex flex-col gap-1.5 border-b border-gray-100 bg-white/95 px-4 py-2.5 backdrop-blur sm:flex-row sm:items-start sm:gap-3">
        <p className="shrink-0 text-xs font-semibold text-gray-600 sm:pt-2">Nomor Soal</p>
        <div className="flex max-h-[7.5rem] min-w-0 flex-1 flex-wrap gap-2 overflow-y-auto p-1 sm:max-h-none">
          {items.map((it, i) => (
            <button
              key={it.nomor}
              type="button"
              onClick={() => pilih(i)}
              aria-current={i === aktif ? 'true' : undefined}
              aria-label={`Soal ${it.nomor}: ${LABEL_HASIL[it.hasil]}`}
              className={`h-10 min-w-10 rounded-lg px-1.5 text-sm font-semibold sm:h-9 sm:min-w-9 tabular-nums ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${PETAK[it.hasil]} ${
                i === aktif ? 'outline-2 outline-offset-0 outline-gray-900' : ''
              }`}
            >
              {it.nomor}
            </button>
          ))}
        </div>
      </nav>

      <div ref={kartu} className="scroll-mt-20 pt-4">
        <header className="flex items-center gap-3 pb-3">
          <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900">Soal {ini.nomor}</p>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${PILL[ini.hasil]}`}>{LABEL_HASIL[ini.hasil]}</span>
        </header>

        <div className="border-t border-gray-100 pt-4">{ini.isi}</div>

        <footer className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <button
            type="button"
            disabled={aktif === 0}
            onClick={() => pilih(aktif - 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white"
          >
            <ChevronLeft size={16} aria-hidden />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={aktif === items.length - 1}
            onClick={() => pilih(aktif + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Berikutnya
            <ChevronRight size={16} aria-hidden />
          </button>
        </footer>
      </div>
    </div>
  )
}
