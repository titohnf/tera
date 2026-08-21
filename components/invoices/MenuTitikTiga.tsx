'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Menu titik tiga di ujung baris invoice dan baris pembayaran.
 *
 * Isinya dirender lewat portal ke `document.body`, bukan di tempat. Kartu
 * invoice memakai `overflow-hidden` demi sudut membulatnya, dan tabel/panel di
 * sekitarnya memakai `overflow-x-auto`; menu yang tumbuh di dalamnya pasti
 * terpotong oleh salah satu dari keduanya. Menaikkan z-index tidak menolong —
 * `overflow` memangkas tanpa peduli lapisan. Portal keluar dari rantai kliping
 * itu sekaligus, dan posisinya dihitung dari letak tombolnya di layar.
 *
 * Sebelumnya logika buka-tutupnya ditulis di `StudentClassInvoiceTable`: satu
 * state `openMenu` berisi id yang sedang terbuka, satu ref, dan satu efek
 * pendengar `mousedown`, dipakai bergantian oleh menu invoice dan menu
 * pembayaran lewat `ref={openMenu === p.id ? openMenuRef : null}`. Karena
 * refnya cuma satu, hanya menu yang terakhir dirender yang benar-benar
 * terpasang — klik di luar tidak selalu menutup menu yang sedang terbuka. Kini
 * tiap menu memegang keadaan dan refnya sendiri.
 */
export default function MenuTitikTiga({
  children,
  label = 'Menu lainnya',
}: {
  /** Isi menu. Menerima `tutup` untuk dipanggil setelah item dipilih. */
  children: (tutup: () => void) => ReactNode
  label?: string
}) {
  const [buka, setBuka] = useState(false)
  const [posisi, setPosisi] = useState<{ top: number; right: number } | null>(null)
  const tombolRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const hitungPosisi = useCallback(() => {
    const r = tombolRef.current?.getBoundingClientRect()
    if (!r) return
    // Digantung di bawah tombol dan dirata-kanankan dengannya, memakai
    // koordinat viewport karena portalnya `position: fixed`.
    setPosisi({ top: r.bottom + 4, right: window.innerWidth - r.right })
  }, [])

  useLayoutEffect(() => {
    if (buka) hitungPosisi()
  }, [buka, hitungPosisi])

  useEffect(() => {
    if (!buka) return

    function klikDiLuar(e: MouseEvent) {
      const t = e.target as Node
      if (!tombolRef.current?.contains(t) && !menuRef.current?.contains(t)) setBuka(false)
    }
    function tekanEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setBuka(false)
    }
    // Digulir atau diubah ukurannya: posisinya dihitung ulang, bukan ditutup —
    // menutup mendadak saat halaman bergeser sedikit terasa seperti gangguan.
    // `capture` supaya guliran di panel dalam pun tertangkap.
    document.addEventListener('mousedown', klikDiLuar)
    document.addEventListener('keydown', tekanEsc)
    window.addEventListener('scroll', hitungPosisi, true)
    window.addEventListener('resize', hitungPosisi)
    return () => {
      document.removeEventListener('mousedown', klikDiLuar)
      document.removeEventListener('keydown', tekanEsc)
      window.removeEventListener('scroll', hitungPosisi, true)
      window.removeEventListener('resize', hitungPosisi)
    }
  }, [buka, hitungPosisi])

  return (
    <>
      <button
        ref={tombolRef}
        type="button"
        onClick={() => setBuka(v => !v)}
        aria-label={label}
        aria-expanded={buka}
        className="flex items-center justify-center w-7 h-7 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {buka &&
        posisi &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: posisi.top, right: posisi.right }}
            className="w-44 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/10 py-1 z-50"
          >
            {children(() => setBuka(false))}
          </div>,
          document.body,
        )}
    </>
  )
}

/** Satu baris di dalam menu — dipakai bersama supaya bentuknya tidak menyimpang. */
export function ItemMenu({
  ikon,
  children,
  ...sisa
}: {
  ikon: ReactNode
  children: ReactNode
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
)) {
  const kelas =
    'flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 transition-colors'

  if ('href' in sisa && sisa.href) {
    const { href, className, ...a } = sisa as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    return (
      <a href={href} className={className ?? kelas} {...a}>
        {ikon}
        {children}
      </a>
    )
  }

  const { className, ...b } = sisa as React.ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type="button" className={className ?? kelas} {...b}>
      {ikon}
      {children}
    </button>
  )
}
