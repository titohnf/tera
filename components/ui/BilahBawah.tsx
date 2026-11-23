'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Ikon solid sederhana (rumah digambar sendiri, orang dari Heroicons, MIT) berisi GRADASI: biru bergradasi saat aktif,
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
        <path
          d="M12 2.9 2.7 11.1a1.2 1.2 0 0 0 .8 2.1h1.1v6.2a2.4 2.4 0 0 0 2.4 2.4h2.4v-6.2a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6v6.2H17a2.4 2.4 0 0 0 2.4-2.4v-6.2h1.1a1.2 1.2 0 0 0 .8-2.1Z"
          stroke={`url(#${id})`}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
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
      <ul className="mx-auto flex h-16 max-w-xl">
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
