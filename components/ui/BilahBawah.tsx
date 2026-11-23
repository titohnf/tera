'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Ikon dua nada (Phosphor Icons "duotone", MIT, Copyright (c) 2023 Phosphor Icons): garis
 * tegas + isian lembut. Aktif: garis Biru Tera dengan isian Tosca Tera; tidak aktif: abu-abu.
 */
function Duotone({ aktif, isian, garis }: { aktif: boolean; isian: string; garis: string }) {
  return (
    <svg viewBox="0 0 256 256" className="h-7 w-7" fill="currentColor" aria-hidden>
      <path d={isian} fill={aktif ? '#20c0b0' : 'currentColor'} opacity={aktif ? 0.55 : 0.2} />
      <path d={garis} />
    </svg>
  )
}

const RUMAH = {
  isian: 'M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z',
  garis:
    'M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z',
}
const ORANG = {
  isian: 'M192,96a64,64,0,1,1-64-64A64,64,0,0,1,192,96Z',
  garis:
    'M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z',
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
                t.aktif ? 'border-tera/30 bg-blue-50 text-tera' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Duotone aktif={t.aktif} {...(t.kunci === 'beranda' ? RUMAH : ORANG)} />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
