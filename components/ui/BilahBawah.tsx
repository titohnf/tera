'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Ikon solid sederhana (bentuk dari Heroicons, MIT) berisi GRADASI: biru bergradasi saat aktif,
 * abu-abu bergradasi saat tidak. Penanda aktif hanya warna — tanpa wadah, garis, atau latar.
 * Gradasinya didefinisikan di tiap ikon (id unik per tab dan keadaan) supaya tidak bergantung
 * pada definisi di tempat lain di halaman.
 */
function Ikon({ kunci, aktif }: { kunci: 'beranda' | 'profil'; aktif: boolean }) {
  const id = `bb-${kunci}-${aktif ? 'a' : 'n'}`
  const [atas, bawah] = aktif ? ['#58A3FF', '#0A4FD6'] : ['#CBD5E1', '#94A3B8']
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill={`url(#${id})`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={atas} />
          <stop offset="1" stopColor={bawah} />
        </linearGradient>
      </defs>
      {kunci === 'beranda' ? (
        <>
          <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
          <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
        </>
      ) : (
        <path d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
      )}
    </svg>
  )
}

/**
 * Bilah navigasi bawah ala aplikasi ponsel, di dalam jangkauan ibu jari.
 * Baru dua tab — Beranda dan Profil; pintu ke Latihan, Misi, Materi, dan Try Out
 * tetap kartu di Beranda. `dasar` adalah alamat beranda rangka, `profil` alamat
 * tab Profil. Tab aktif dihitung dari alamat: Profil bila alamat berada di
 * bawahnya, selain itu Beranda. Aktif = ikon dan teks berwarna biru; tidak aktif = abu-abu.
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
              className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs font-extrabold transition-colors ${
                t.aktif ? 'text-tera' : 'text-slate-400'
              }`}
            >
              <Ikon kunci={t.kunci} aktif={t.aktif} />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
