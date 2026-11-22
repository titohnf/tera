'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { BidangRiwayat, RiwayatMapel, TopikPerTryOut } from '@/lib/tryout/riwayat-kemampuan'

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const bulat = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 0 })

type Tingkat = { label: string; sel: string; teks: string }

function tingkat(p: number | null): Tingkat {
  if (p === null) return { label: 'Belum ada data', sel: '', teks: 'text-gray-300' }
  if (p >= 75) return { label: 'Sudah kuat', sel: 'bg-green-50', teks: 'text-green-800' }
  if (p >= 50) return { label: 'Cukup', sel: 'bg-amber-50', teks: 'text-amber-800' }
  return { label: 'Perlu dilatih', sel: 'bg-red-50', teks: 'text-red-700' }
}

/** Satu sel nilai: persen skor, dan jumlah soal benar di bawahnya. Bila `onBuka` ada, selnya tombol yang membuka soal-soalnya. */
function Sel({ x, onBuka, label }: { x: TopikPerTryOut | null; onBuka?: () => void; label?: string }) {
  const t = tingkat(x ? x.persen : null)
  const isi =
    x && x.persen !== null ? (
      <>
        <span className={`block text-xs font-semibold tabular-nums sm:text-sm ${t.teks}`}>{bulat(x.persen)}%</span>
        <span className="block text-[10px] tabular-nums text-gray-500 sm:text-[11px]">
          {x.benar}/{x.total}
        </span>
        <span className="sr-only">{t.label}</span>
      </>
    ) : (
      <span className="text-gray-300" aria-label="Tidak diuji">
        –
      </span>
    )
  if (onBuka && x && x.persen !== null) {
    return (
      <td className={`border-l border-gray-100 p-0 align-middle ${t.sel}`}>
        <button
          type="button"
          onClick={onBuka}
          aria-haspopup="dialog"
          aria-label={`Lihat soal: ${label ?? ''}, ${bulat(x.persen)} persen`}
          className="block w-full cursor-pointer px-1 py-2 text-center hover:brightness-95 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-500 sm:px-2"
        >
          {isi}
        </button>
      </td>
    )
  }
  return <td className={`border-l border-gray-100 px-1 py-2 text-center align-middle sm:px-2 ${t.sel}`}>{isi}</td>
}

/** Pop up bawaan peramban (`dialog`): Esc dan ketukan di luar menutupnya, fokus dikembalikan otomatis. */
function Popup({ judul, onTutup, children }: { judul: string; onTutup: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      aria-label={judul}
      className="m-auto w-[min(44rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-gray-900/40"
    >
      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-900">{judul}</p>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Tutup"
          className="-my-1 -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-500"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="max-h-[calc(85dvh-3.5rem)] overflow-y-auto px-4 pb-4">{children}</div>
    </dialog>
  )
}

/** Selisih antara dua try out terakhir yang menguji topik ini; naik, turun, atau tetap. */
function Tren({ nilai }: { nilai: (number | null)[] }) {
  const ada = nilai.filter((v): v is number => v !== null)
  if (ada.length < 2) return <td className="hidden border-l border-gray-100 px-2 py-2 text-center text-gray-300 sm:table-cell">–</td>
  const r = Math.round(ada[ada.length - 1] - ada[ada.length - 2])
  const naik = r > 0
  const turun = r < 0
  return (
    <td className="hidden border-l border-gray-100 px-2 py-2 text-center sm:table-cell">
      <span className={`text-sm font-semibold tabular-nums ${naik ? 'text-green-700' : turun ? 'text-red-700' : 'text-gray-500'}`}>
        <span aria-hidden>{naik ? '▲' : turun ? '▼' : '='}</span> {Math.abs(r)}
      </span>
      <span className="sr-only">{naik ? ' naik' : turun ? ' turun' : ' tetap'}</span>
    </td>
  )
}

/** Satu bidang: barisnya bisa diketuk untuk membuka atau menutup topik di bawahnya (1.1, 1.2, ...). Awalnya terbuka. */
function GrupBidang({ b, no, kolom, adaTren, bisaBuka, onBuka }: { b: BidangRiwayat; no: number; kolom: number[]; adaTren: boolean; bisaBuka: (kunci: string) => boolean; onBuka: (kunci: string, judul: string) => void }) {
  const [buka, setBuka] = useState(true)
  const idTopik = useId()
  return (
    <tbody>
      <tr className="bg-gray-50">
        <th scope="colgroup" className="border-t border-gray-200 bg-gray-50 p-0 text-left">
          <button
            type="button"
            onClick={() => setBuka((v) => !v)}
            aria-expanded={buka}
            aria-controls={idTopik}
            className="flex w-full items-start gap-1.5 px-2 py-2 text-left text-[13px] font-semibold leading-snug text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-400 sm:px-3 sm:text-sm"
          >
            <span className={`mt-[3px] shrink-0 text-[10px] text-gray-400 transition-transform ${buka ? 'rotate-90' : ''}`} aria-hidden>
              ▶
            </span>
            <span className="shrink-0 tabular-nums text-gray-400">{no}.</span>
            <span className="min-w-0 break-words">{b.nama}</span>
          </button>
        </th>
        {kolom.map((i) => {
          const p = b.persenPerTryOut[i] ?? null
          return (
            <td key={i} className={`border-l border-t border-gray-200 px-1 py-2 text-center text-xs font-semibold tabular-nums sm:px-2 sm:text-sm ${tingkat(p).teks}`}>
              {p !== null ? `${bulat(p)}%` : '–'}
            </td>
          )
        })}
        {adaTren && <Tren nilai={b.persenPerTryOut} />}
      </tr>
      {buka &&
        b.topik.map((t, ti) => (
          <tr key={t.kunci} id={ti === 0 ? idTopik : undefined} className="bg-white">
            <th scope="row" className="border-t border-gray-100 bg-white px-2 py-2 pl-3 text-left text-[13px] font-normal leading-snug text-gray-700 break-words hyphens-auto sm:px-3 sm:pl-5 sm:text-sm">
              <span className="flex gap-1.5">
                <span className="w-6 shrink-0 tabular-nums text-gray-400 sm:w-7">
                  {no}.{ti + 1}
                </span>
                <span className="min-w-0">{t.nama}</span>
              </span>
            </th>
            {kolom.map((i) => (
              <Sel
                key={i}
                x={t.perTryOut[i] ?? null}
                label={`${no}.${ti + 1} ${t.nama}, TO ${i + 1}`}
                onBuka={bisaBuka(`${t.kunci}|${i}`) ? () => onBuka(`${t.kunci}|${i}`, `${no}.${ti + 1} ${t.nama} · TO ${i + 1}`) : undefined}
              />
            ))}
            {adaTren && <Tren nilai={t.perTryOut.map((x) => (x ? x.persen : null))} />}
          </tr>
        ))}
    </tbody>
  )
}

const KOLOM_MINIMAL = 5

/**
 * Hasil kemampuan anak untuk satu mata pelajaran sebagai tabel: tiap baris satu topik, tiap kolom satu
 * try out, jadi perkembangan terbaca ke samping dan try out berikutnya mengisi kolom yang kosong.
 * Tanpa pembanding nasional atau rata-rata peserta (itu untuk admin).
 */
export function TabelHasil({ m, soal }: { m: RiwayatMapel; soal?: Record<string, ReactNode> }) {
  const [pilih, setPilih] = useState<{ kunci: string; judul: string } | null>(null)
  // Selalu minimal 5 kolom; try out yang belum dikerjakan tampil kosong dan terisi sendiri saat datanya ada.
  const kolom = Array.from({ length: Math.max(KOLOM_MINIMAL, m.tryOut.length) }, (_, i) => i)
  const adaTren = m.tryOut.length > 1
  return (
    <div className="space-y-3">
      <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg text-left ring-1 ring-gray-200">
        <thead>
          <tr className="bg-slate-50">
            <th scope="col" className="w-[31%] bg-slate-50 px-2 py-2.5 text-xs font-medium text-gray-500 sm:w-[34%] sm:px-3">
              Topik
            </th>
            {kolom.map((i) => {
              const to = m.tryOut[i]
              return (
                <th key={i} scope="col" className="border-l border-gray-100 px-1 py-2.5 text-center sm:px-2">
                  <span className={`block text-[11px] font-medium leading-tight sm:text-xs ${to ? 'text-gray-500' : 'text-gray-300'}`}>
                    <span className="sm:hidden">TO {i + 1}</span>
                    <span className="hidden sm:inline">Try Out {i + 1}</span>
                  </span>
                  <span className={`block text-xs font-semibold tabular-nums sm:text-base ${to ? 'text-gray-900' : 'text-gray-300'}`}>{to && to.nilai !== null ? fmt(to.nilai) : '–'}</span>
                </th>
              )
            })}
            {adaTren && (
              <th scope="col" className="hidden w-20 border-l border-gray-100 px-2 py-2.5 text-center text-xs font-medium text-gray-500 sm:table-cell">
                Perubahan
              </th>
            )}
          </tr>
        </thead>
        {m.bidang.map((b, bi) => (
          <GrupBidang key={b.kunci} b={b} no={bi + 1} kolom={kolom} adaTren={adaTren} bisaBuka={(k) => !!soal && k in soal} onBuka={(kunci, judul) => setPilih({ kunci, judul })} />
        ))}
      </table>
      {soal && <p className="text-xs text-gray-500">Ketuk persentase pada sebuah topik untuk melihat soal, jawaban anak, dan kuncinya.</p>}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-200" />75% ke atas, sudah kuat</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-200" />50–74%, cukup</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-200" />di bawah 50%, perlu dilatih</span>
      </p>
      {pilih && soal && pilih.kunci in soal && (
        <Popup key={pilih.kunci} judul={pilih.judul} onTutup={() => setPilih(null)}>
          {soal[pilih.kunci]}
        </Popup>
      )}
    </div>
  )
}
