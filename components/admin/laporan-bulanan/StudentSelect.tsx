'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Option = { value: string; label: string }

/**
 * Pemilih siswa yang bisa dicari: ketik sebagian nama, pilih dengan klik atau
 * panah + Enter. Pilihannya ditulis ke `?student_id=` dan halaman dimuat ulang,
 * sama seperti pemilih biasa yang digantikannya — parameter lain di alamat
 * (mis. bulan) ikut terbawa.
 *
 * Dipakai tiga menu Laporan Belajar (Progres Kelas, Latihan Mandiri,
 * Ketuntasan Materi).
 */
export default function StudentSelect({ options, value }: { options: Option[]; value: string }) {
  const terpilih = options.find(o => o.value === value) ?? null
  const [buka, setBuka] = useState(false)
  const [kata, setKata] = useState('')
  const [aktif, setAktif] = useState(0)
  const wadah = useRef<HTMLDivElement>(null)
  const daftarEl = useRef<HTMLUListElement>(null)

  const daftar = useMemo(() => {
    const k = kata.trim().toLowerCase()
    return k ? options.filter(o => o.label.toLowerCase().includes(k)) : options
  }, [options, kata])

  // Klik di luar menutup daftar.
  useEffect(() => {
    function luar(e: MouseEvent) {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false)
    }
    document.addEventListener('mousedown', luar)
    return () => document.removeEventListener('mousedown', luar)
  }, [])

  // Baris yang disorot selalu terlihat saat berpindah dengan panah.
  useEffect(() => {
    if (!buka) return
    daftarEl.current?.children[aktif]?.scrollIntoView({ block: 'nearest' })
  }, [aktif, buka])

  function pilih(v: string) {
    const url = new URL(window.location.href)
    if (v) url.searchParams.set('student_id', v)
    else url.searchParams.delete('student_id')
    window.location.href = url.toString()
  }

  function tombol(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setBuka(true)
      setAktif(i => Math.min(i + 1, daftar.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktif(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (buka && daftar[aktif]) pilih(daftar[aktif].value)
    } else if (e.key === 'Escape') {
      setBuka(false)
      e.currentTarget.blur()
    }
  }

  return (
    <div ref={wadah} className="relative min-w-[260px]">
      <input
        type="text"
        role="combobox"
        aria-expanded={buka}
        aria-controls="daftar-siswa"
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Cari siswa…"
        value={buka ? kata : (terpilih?.label ?? '')}
        onFocus={e => {
          setKata('')
          setAktif(0)
          setBuka(true)
          e.currentTarget.select()
        }}
        onChange={e => {
          setKata(e.target.value)
          setAktif(0)
          setBuka(true)
        }}
        onKeyDown={tombol}
        className="w-full pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {terpilih && !buka && (
        <button
          type="button"
          aria-label="Hapus pilihan siswa"
          onClick={() => pilih('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {buka && (
        <ul
          id="daftar-siswa"
          ref={daftarEl}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {daftar.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">Siswa tidak ditemukan.</li>
          ) : (
            daftar.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                // mousedown, bukan click: input kehilangan fokus lebih dulu dan
                // menutup daftar sebelum click sempat sampai ke barisnya.
                onMouseDown={e => {
                  e.preventDefault()
                  pilih(o.value)
                }}
                onMouseEnter={() => setAktif(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === aktif ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } ${o.value === value ? 'font-medium' : ''}`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
