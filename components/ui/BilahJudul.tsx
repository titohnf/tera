/**
 * Bagian bersama bilah judul (title bar) ala aplikasi ponsel: panah kembali di
 * kiri, judul layar di sebelahnya. Dipakai `KepalaBelajar` (permukaan /belajar)
 * dan `BilahAtas` (rangka /siswa, /mandiri, /umum) supaya semua layar siswa
 * tampak satu aplikasi.
 */

/** Bilah menempel di puncak layar saat isi digulir, seperti app bar di ponsel. */
export const KELAS_BILAH =
  'sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-gray-200 bg-white px-4 sm:px-6'

// 44px: ukuran sasaran sentuh terkecil yang masih nyaman untuk ibu jari.
export const GAYA_KEMBALI =
  '-ml-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-slate-100 hover:text-gray-900'

/** Panah kiri. SVG, bukan '‹': glyph kurung tunggal tipis di sebagian ponsel Android. */
export function PanahKiri() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function JudulBilah({ children }: { children: React.ReactNode }) {
  return <h1 className="truncate text-base font-semibold text-gray-900">{children}</h1>
}
