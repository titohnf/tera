'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useSyncExternalStore } from 'react'
import { langganan, snapshotServer, snapshotTerbaca, urai } from '@/lib/notif-terbaca'

/**
 * Bilah navigasi bawah portal keluarga.
 *
 * Portal ini praktis hanya dibuka dari ponsel, dan sebelumnya seluruh isinya
 * ditumpuk di satu halaman bertab: Kelas, Tagihan, Laporan, Belajar. Bilah tab
 * itu meluber di layar 390px, dan tab yang jauh di kanan praktis tidak pernah
 * diketuk. Empat tujuan di dasar layar bisa dijangkau ibu jari dan tetap
 * terlihat sambil menggulir.
 *
 * "Jadwal" sempat bernama "Riwayat" selagi ia menaungi Jadwal Kelas dan
 * Laporan sekaligus. Begitu Laporan pindah ke bawah Profil, nama itu jadi
 * lebih kabur daripada isinya — yang ada di sana adalah jadwal sesi, dan
 * kelas yang sudah selesai diringkas di dasarnya.
 *
 * "Latihan" keluar dari portal ini — ia menuju `/belajar`, permukaan yang
 * dipakai bersama pelanggan langganan. Sebelumnya ia sebuah kartu bernama
 * "SORA" di beranda, di bawah jadwal dan petak pintasan; nama produknya tidak
 * memberi tahu anak apa yang ada di baliknya, dan letaknya menuntut satu
 * gulir. Sebagai tab ia sejajar dengan hal-hal yang paling sering dibuka, dan
 * namanya menyebut kegiatannya.
 *
 * Karena tujuannya di luar `/keluarga/[id]`, ia tidak bisa memakai `cocok`
 * yang diukur dari awalan itu; `luar` yang menyalakannya. Bilah ini ikut
 * dirender di sana (lihat `components/belajar/BilahKeluarga`) supaya tab yang
 * terbuka tidak menghilangkan tab-tab lainnya — pindah ke latihan adalah
 * pindah tab, bukan meninggalkan portal.
 *
 * Tagihan, Laporan, Riwayat Kelas, dan Penguasaan tidak punya tempat di sini;
 * keempatnya dijangkau dari petak ikon di beranda, dan bilah ini tidak dirender
 * sama sekali di sana (lihat `RangkaAnak`) — keempatnya sudah membawa panah
 * kembali ke beranda di kepala layar. Karena itu tidak ada satu pun sub-path
 * mereka di daftar `cocok`; kalau suatu saat salah satunya kembali berbilah,
 * sub-pathnya perlu ditambahkan ke "Beranda" supaya ada yang menyala.
 *
 * Karena satu item bisa menaungi beberapa halaman, yang menyala ditentukan oleh
 * daftar `cocok`, bukan oleh perbandingan persis dengan `href`.
 */

type Item = {
  label: string
  href: (id: string) => string
  /** Sub-path (setelah `/keluarga/[id]`) yang membuat item ini menyala. */
  cocok: string[]
  /**
   * Awalan path PENUH di luar portal yang membuat item ini menyala — untuk
   * tujuan yang tidak hidup di bawah `/keluarga/[id]`.
   */
  luar?: string
  /** Item yang membawa angka kabar belum dibaca. Hanya lonceng. */
  lencana?: true
  ikon: React.ReactNode
}

const ITEMS: Item[] = [
  {
    label: 'Beranda',
    href: (id) => `/keluarga/${id}`,
    cocok: [''],
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    ),
  },
  {
    label: 'Latihan',
    /* `?anak=` wajib: `belajarContext()` perlu tahu atas nama siapa, dan
       memeriksanya lagi lewat `practice_start_as_child()` di database. */
    href: (id) => `/belajar?anak=${id}`,
    cocok: [],
    luar: '/belajar',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    label: 'Notifikasi',
    href: (id) => `/keluarga/${id}/notifikasi`,
    cocok: ['/notifikasi'],
    lencana: true,
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    ),
  },
  {
    label: 'Profil',
    href: (id) => `/keluarga/${id}/profil`,
    cocok: ['/profil'],
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    ),
  },
]

export default function BottomNav({
  studentId,
  idNotifikasi = [],
}: {
  studentId: string
  /** Id kabar yang sedang ada — yang belum dibaca disaring di browser. */
  idNotifikasi?: string[]
}) {
  const pathname = usePathname()
  const mentah = useSyncExternalStore(langganan, snapshotTerbaca, snapshotServer)
  const terbaca = useMemo(() => urai(mentah), [mentah])
  const belumDibaca = terbaca === null
    ? 0
    : idNotifikasi.filter((id) => !terbaca.has(id)).length
  const awalan = `/keluarga/${studentId}`
  const diPortal = pathname.startsWith(awalan)
  const sisa = diPortal ? pathname.slice(awalan.length) : ''

  return (
    <nav
      aria-label="Navigasi utama"
      /* `pb-[env(safe-area-inset-bottom)]` menahan bilah ini di atas garis
         geser iPhone; tanpa itu label paling bawah tertutup separuh. */
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4">
        {ITEMS.map((it) => {
          /* `diPortal` menjaga agar di luar portal TIDAK ada yang menyala
             lewat `cocok`: `sisa` di sana kosong, dan "Beranda" cocok dengan
             sisa kosong — tanpa syarat ini ia ikut menyala di /belajar. */
          const aktif = it.luar
            ? pathname.startsWith(it.luar)
            : diPortal && it.cocok.some((c) => (c === '' ? sisa === '' : sisa.startsWith(c)))
          return (
            <Link
              key={it.label}
              href={it.href(studentId)}
              aria-current={aktif ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2 min-h-14 justify-center transition-colors ${
                aktif ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="relative">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {it.ikon}
                </svg>
                {it.lencana && belumDibaca > 0 && (
                  <span
                    /* Lencananya menempel di ikon, bukan di sel — kalau ia ikut
                       aliran teks, label di bawahnya bergeser saat angkanya
                       muncul dan seluruh bilah tampak bergoyang. */
                    className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold leading-4 text-center"
                    aria-label={`${belumDibaca} notifikasi belum dibaca`}
                  >
                    {belumDibaca > 9 ? '9+' : belumDibaca}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">{it.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
