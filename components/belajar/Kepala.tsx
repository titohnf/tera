'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Kepala permukaan belajar, beserta tombol kembalinya.
 *
 * Tombol kembali tinggal di header, bukan di badan halaman: langkah-langkah
 * memilih latihan seluruhnya hidup di browser (`PemilihLatihan`), jadi tidak
 * ada URL yang bisa ditautkan — dan "← Ganti mapel" yang menumpang di atas
 * daftar adalah kendali navigasi yang berpura-pura jadi isi. Di header ia
 * berada di tempat yang sama untuk setiap langkah.
 *
 * Header dirender oleh layout, sedangkan yang tahu ada tidaknya langkah untuk
 * dimundurkan adalah komponen jauh di bawahnya. Konteks ini jembatannya: yang
 * punya langkah memanggil `useTombolKembali(fn)`, dan header menampilkannya.
 *
 * Tanpa langkah, tombolnya TIDAK hilang melainkan berubah jadi tautan keluar.
 * Ia satu-satunya jalan pulang sejak tombol "Selesai" dihapus, dan header yang
 * kosong di layar pertama berarti anak yang membuka permukaan ini terkurung di
 * dalamnya.
 */
type Kembali = (() => void) | null

const KonteksKepala = createContext<{
  kembali: Kembali
  pasang: (fn: Kembali) => void
  judul: string | null
  pasangJudul: (judul: string | null) => void
}>({ kembali: null, pasang: () => {}, judul: null, pasangJudul: () => {} })

export function PenyediaKepala({ children }: { children: React.ReactNode }) {
  const [kembali, setKembali] = useState<Kembali>(null)
  const [judul, setJudul] = useState<string | null>(null)
  // Pembungkus fungsi: `setState` menganggap fungsi sebagai pembaru, jadi
  // menyimpan fungsi harus lewat satu lapis lagi.
  const pasang = useCallback((fn: Kembali) => setKembali(() => fn), [])
  const pasangJudul = useCallback((j: string | null) => setJudul(j), [])
  return (
    <KonteksKepala value={{ kembali, pasang, judul, pasangJudul }}>{children}</KonteksKepala>
  )
}

/** Memasang (atau melepas) tombol kembali di header selama komponen terpasang. */
export function useTombolKembali(fn: Kembali) {
  const { pasang } = useContext(KonteksKepala)
  useEffect(() => {
    pasang(fn)
    return () => pasang(null)
  }, [pasang, fn])
}

const GAYA_KEMBALI =
  '-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-slate-100 hover:text-gray-900'

/**
 * Mengganti judul header selama komponen terpasang.
 *
 * Judul yang ikut berpindah membuat header jadi keterangan tempat, bukan papan
 * nama: begitu sebuah mapel dibuka, yang perlu dibaca anak adalah ia sedang di
 * mana — "Matematika Kelas 7" — bukan bahwa ini halaman latihan soal, yang
 * sudah jelas dari isinya.
 */
export function useJudulKepala(judul: string | null) {
  const { pasangJudul } = useContext(KonteksKepala)
  useEffect(() => {
    pasangJudul(judul)
    return () => pasangJudul(null)
  }, [pasangJudul, judul])
}

export function KepalaBelajar() {
  const { kembali, judul } = useContext(KonteksKepala)
  return (
    <header className="flex h-14 items-center gap-1 border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
      {kembali ? (
        <button type="button" onClick={kembali} aria-label="Kembali" className={GAYA_KEMBALI}>
          <span className="text-xl leading-none" aria-hidden>
            ‹
          </span>
        </button>
      ) : (
        <Link href="/" aria-label="Keluar dari latihan" className={GAYA_KEMBALI}>
          <span className="text-xl leading-none" aria-hidden>
            ‹
          </span>
        </Link>
      )}
      <h1 className="truncate text-base font-semibold text-gray-900">
        {judul ?? 'Latihan Soal'}
      </h1>
    </header>
  )
}
