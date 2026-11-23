'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const IKON = {
  beranda: (
    <path d="M3 10.5 12 3l9 7.5M5.5 9v10.5a.5.5 0 0 0 .5.5h3.5v-5.5h5V20H18a.5.5 0 0 0 .5-.5V9" />
  ),
  profil: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.6-3.6 3.3-5.5 7-5.5s6.4 1.9 7 5.5" />
    </>
  ),
}

/**
 * Bilah navigasi bawah ala aplikasi ponsel, di dalam jangkauan ibu jari.
 * Baru dua tab — Beranda dan Profil; pintu ke Latihan, Misi, Materi, dan Try Out
 * tetap kartu di Beranda. `dasar` adalah alamat beranda rangka, `profil` alamat
 * tab Profil. Tab aktif dihitung dari alamat: Profil bila alamat berada di
 * bawahnya, selain itu Beranda.
 */
export default function BilahBawah({ dasar, profil }: { dasar: string; profil: string }) {
  const pathname = usePathname()
  const diProfil = pathname === profil || pathname.startsWith(profil + '/')
  const tab = [
    { kunci: 'beranda' as const, label: 'Beranda', href: dasar, aktif: !diProfil },
    { kunci: 'profil' as const, label: 'Profil', href: profil, aktif: diProfil },
  ]
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-5xl">
        {tab.map(t => (
          <li key={t.kunci} className="flex-1">
            <Link
              href={t.href}
              aria-current={t.aktif ? 'page' : undefined}
              className={`mx-3 my-1.5 flex h-[calc(100%-0.75rem)] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-xs font-extrabold transition ${
                t.aktif ? 'border-tera/30 bg-blue-50 text-tera' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={t.aktif ? 2 : 1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                {IKON[t.kunci]}
              </svg>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
