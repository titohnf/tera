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
 * "Belajar" pernah tinggal di sini sebagai tab, menuju `/belajar`, permukaan
 * yang dipakai bersama pelanggan langganan. Ia pindah ke sebuah petak di
 * beranda — lihat `PintasanKeluarga` — dan bilah ini berhenti menyala di
 * `/belajar`. Bilahnya juga tidak dirender di sana: yang membawa orang pulang
 * ke portal adalah `components/belajar/PulangKe` di kepala layar.
 *
 * Tempat yang ditinggalkannya diisi "Misi", peta kompetensi berkunci topik
 * pengukuran. Bukan penggantinya melainkan tetangganya: Belajar menyusun
 * dunia menurut bab kurikulum bimbel, Misi menurut apa yang diukur, dan
 * migrasi 148 memisahkan butir keduanya dengan trigger. Keduanya memang
 * berdampingan permanen.
 *
 * Tagihan, Laporan, Kelas, dan Belajar tidak punya tempat di sini;
 * keempatnya dijangkau dari petak ikon di beranda, dan bilah ini tidak dirender
 * sama sekali di sana (lihat `RangkaAnak`) — semuanya sudah membawa panah
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
    label: 'Misi',
    href: (id) => `/keluarga/${id}/misi`,
    cocok: ['/misi'],
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
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
          const aktif = diPortal && it.cocok.some((c) => (c === '' ? sisa === '' : sisa.startsWith(c)))
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
