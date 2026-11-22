'use client'

import { useEffect, useState, type ReactNode } from 'react'

export type HasilButir = 'benar' | 'sebagian' | 'salah' | 'belum'

export interface ItemSoal {
  nomor: number
  hasil: HasilButir
  /** Isi kartu soal ini, sudah dirender di server. */
  isi: ReactNode
}

const PETAK: Record<HasilButir, string> = {
  benar: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  sebagian: 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100',
  salah: 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100',
  belum: 'bg-gray-50 text-gray-500 ring-gray-200 hover:bg-gray-100',
}

const LABEL: Record<HasilButir, string> = { benar: 'Benar', sebagian: 'Benar sebagian', salah: 'Belum tepat', belum: 'Dilewati' }
const PILL: Record<HasilButir, string> = {
  benar: 'bg-emerald-100 text-emerald-800',
  sebagian: 'bg-amber-100 text-amber-800',
  salah: 'bg-rose-100 text-rose-700',
  belum: 'bg-gray-100 text-gray-600',
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

  const pilih = (i: number) => {
    setAktif(i)
    try {
      window.history.replaceState(null, '', `#soal-${items[i].nomor}`)
    } catch {}
  }

  if (items.length === 0) return null
  const ini = items[aktif]

  return (
    <div className="space-y-3">
      <nav aria-label="Nomor soal" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Nomor Soal</h2>
          <p className="text-xs text-gray-500">Ketuk nomor untuk membuka soalnya</p>
        </div>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
          {items.map((it, i) => (
            <button
              key={it.nomor}
              type="button"
              onClick={() => pilih(i)}
              aria-current={i === aktif ? 'true' : undefined}
              aria-label={`Soal ${it.nomor}: ${LABEL[it.hasil]}`}
              className={`h-9 rounded-lg text-sm font-semibold tabular-nums ring-1 transition-colors ${PETAK[it.hasil]} ${i === aktif ? 'ring-2 ring-blue-600' : ''}`}
            >
              {it.nomor}
            </button>
          ))}
        </div>
        <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <Legenda warna="bg-emerald-400" teks="Benar" />
          <Legenda warna="bg-amber-400" teks="Benar sebagian" />
          <Legenda warna="bg-rose-400" teks="Belum tepat" />
          <Legenda warna="bg-gray-300" teks="Dilewati" />
        </p>
      </nav>

      <article id={`soal-${ini.nomor}`} className="scroll-mt-4 rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">
            Soal {ini.nomor} <span className="font-normal text-gray-400">dari {items.length}</span>
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL[ini.hasil]}`}>{LABEL[ini.hasil]}</span>
        </header>
        <div className="px-4 py-4">{ini.isi}</div>
        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            disabled={aktif === 0}
            onClick={() => pilih(aktif - 1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={aktif === items.length - 1}
            onClick={() => pilih(aktif + 1)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            Berikutnya
          </button>
        </footer>
      </article>
    </div>
  )
}

function Legenda({ warna, teks }: { warna: string; teks: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${warna}`} aria-hidden />
      {teks}
    </span>
  )
}
