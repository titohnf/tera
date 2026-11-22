'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

export type HasilButir = 'benar' | 'sebagian' | 'salah' | 'belum'

export interface ItemSoal {
  nomor: number
  hasil: HasilButir
  /** Isi kartu soal ini, sudah dirender di server. */
  isi: ReactNode
}

export const LABEL_HASIL: Record<HasilButir, string> = { benar: 'Benar', sebagian: 'Benar sebagian', salah: 'Belum tepat', belum: 'Dilewati' }

/** Petak nomor: warna menurut hasil. */
const PETAK: Record<HasilButir, string> = {
  benar: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  sebagian: 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100',
  salah: 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100',
  belum: 'bg-gray-50 text-gray-500 ring-gray-200 hover:bg-gray-100',
}
const NOMOR: Record<HasilButir, string> = {
  benar: 'bg-emerald-100 text-emerald-800',
  sebagian: 'bg-amber-100 text-amber-800',
  salah: 'bg-rose-100 text-rose-700',
  belum: 'bg-gray-100 text-gray-600',
}
const PILL: Record<HasilButir, string> = {
  benar: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  sebagian: 'bg-amber-50 text-amber-700 ring-amber-200',
  salah: 'bg-rose-50 text-rose-700 ring-rose-200',
  belum: 'bg-gray-50 text-gray-600 ring-gray-200',
}

/**
 * Satu soal per nomor: deretan nomor berwarna (menurut hasilnya) untuk berpindah, dan tombol
 * Sebelumnya/Berikutnya. Nomor aktif mengikuti `#soal-N` di alamat, supaya tautan dari Laporan
 * Try Out mendarat tepat di soalnya.
 */
export default function PenelusurSoal({ items }: { items: ItemSoal[] }) {
  const [aktif, setAktif] = useState(0)

  useEffect(() => {
    const dariHash = () => {
      const m = window.location.hash.match(/^#soal-(\d+)$/)
      if (!m) return
      const i = items.findIndex((x) => x.nomor === Number(m[1]))
      if (i >= 0) setAktif(i)
    }
    dariHash()
    window.addEventListener('hashchange', dariHash)
    return () => window.removeEventListener('hashchange', dariHash)
  }, [items])

  const pilih = (i: number, geser = false) => {
    setAktif(i)
    try {
      window.history.replaceState(null, '', `#soal-${items[i].nomor}`)
    } catch {}
    // Pindah lewat tombol bawah: bawa pembaca ke awal soal berikutnya, bukan membiarkannya di dasar kartu.
    if (geser) document.getElementById('kartu-soal')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  if (items.length === 0) return null
  const ini = items[aktif]

  return (
    <div className="space-y-4">
      <nav aria-label="Nomor soal" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Nomor Soal</h2>
          <p className="text-xs text-gray-500">Ketuk nomor untuk membuka soalnya</p>
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {items.map((it, i) => (
            <button
              key={it.nomor}
              type="button"
              onClick={() => pilih(i)}
              aria-current={i === aktif ? 'true' : undefined}
              aria-label={`Soal ${it.nomor}: ${LABEL_HASIL[it.hasil]}`}
              className={`h-10 rounded-xl text-sm font-semibold tabular-nums ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${PETAK[it.hasil]} ${
                i === aktif ? 'ring-2 ring-gray-900 ring-offset-2' : ''
              }`}
            >
              {it.nomor}
            </button>
          ))}
        </div>
      </nav>

      <article id="kartu-soal" aria-labelledby="judul-soal" className="scroll-mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-semibold tabular-nums ${NOMOR[ini.hasil]}`} aria-hidden>
            {ini.nomor}
          </span>
          <div className="min-w-0 flex-1">
            <p id="judul-soal" className="text-sm font-semibold text-gray-900">
              Soal {ini.nomor}
            </p>
            <p className="text-xs text-gray-500">
              {aktif + 1} dari {items.length} soal
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${PILL[ini.hasil]}`}>{LABEL_HASIL[ini.hasil]}</span>
        </header>

        <div className="px-4 py-5 sm:px-5">{ini.isi}</div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-slate-50/60 px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={aktif === 0}
            onClick={() => pilih(aktif - 1, true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white"
          >
            <ChevronLeft size={16} aria-hidden />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={aktif === items.length - 1}
            onClick={() => pilih(aktif + 1, true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Berikutnya
            <ChevronRight size={16} aria-hidden />
          </button>
        </footer>
      </article>
    </div>
  )
}
