'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { bukaKunciJawaban } from '@/app/belajar/actions'

/**
 * Tombol kunci jawaban sebuah paket.
 *
 * Dua tempat memakainya: di dalam kartu paket pada layar hasil (`dalamKartu`,
 * link kecil dengan panah di bawah nilai), karena kunci ini milik paket yang
 * kartunya baru saja ditampilkan; dan sebagai tombol sekunder di
 * `PilihanSesudahSkor` untuk sesi yang tidak punya kartu itu.
 *
 * HARGANYA DISAMPAIKAN DI POP-UP, bukan ditulis di samping tombolnya. Membuka
 * kunci menghentikan paket (nilainya berhenti di sini, dan tidak bisa
 * dikembalikan), jadi satu ketukan tidak boleh langsung melakukannya. Pop-up
 * menyebutkannya dan meminta persetujuan. Paket yang sudah terkunci tidak lagi
 * diberi peringatan: yang hilang sudah hilang, dan tombolnya cuma membuka layar.
 */
export default function TombolKunciJawaban({
  sesiId,
  terkunci,
  namaPaket,
  dalamKartu = false,
}: {
  sesiId: string
  /** Kuncinya sudah pernah dibuka, jadi tombol ini tinggal membuka layarnya lagi. */
  terkunci: boolean
  /** Nama paketnya (mis. "Level 2"), dipakai di tombol luar kartu. */
  namaPaket?: string | null
  dalamKartu?: boolean
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [tanya, setTanya] = useState(false)
  const [sibuk, mulai] = useTransition()

  useEffect(() => {
    if (!tanya) return
    function tekan(e: KeyboardEvent) {
      if (e.key === 'Escape' && !sibuk) setTanya(false)
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [tanya, sibuk])

  const judul = `Lihat Kunci Jawaban${namaPaket && !dalamKartu ? ` ${namaPaket}` : ''}`
  const gaya = dalamKartu
    ? 'inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700 hover:underline disabled:text-gray-400'
    : 'block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-kartu transition hover:bg-slate-100 disabled:text-gray-400'

  const isi = (
    <>
      {judul}
      {dalamKartu && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  )

  function buka() {
    setGalat(null)
    mulai(async () => {
      const aksi: () => Promise<{ error: string } | void> = () => bukaKunciJawaban(sesiId)
      const hasil = await aksi()
      if (hasil && 'error' in hasil) {
        setTanya(false)
        setGalat(hasil.error)
      }
    })
  }

  return (
    <div className={dalamKartu ? 'mt-1.5 ml-auto space-y-1 text-right' : 'space-y-2'}>
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {terkunci ? (
        <Link href={`/belajar/${sesiId}/hasil?kunci=1`} className={gaya}>
          {isi}
        </Link>
      ) : (
        <button type="button" onClick={() => setTanya(true)} className={gaya}>
          {isi}
        </button>
      )}

      {tanya &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !sibuk && setTanya(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="judul-kunci"
              className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <p id="judul-kunci" className="text-base font-semibold text-gray-900">
                Lihat kunci jawaban?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Paket ini terkunci sesudahnya — nilainya berhenti di sini.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={sibuk}
                  onClick={() => setTanya(false)}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 transition hover:bg-slate-50 disabled:text-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={sibuk}
                  onClick={buka}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {sibuk ? 'Membuka…' : 'Lihat Kunci'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
