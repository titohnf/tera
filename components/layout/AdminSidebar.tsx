'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BookOpenIcon,
  BookmarkSquareIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  FlagIcon,
  HomeIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  PresentationChartBarIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  SunIcon,
  TagIcon,
  TicketIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

type NavItem = { href: string; label: string; icon: React.ReactNode; alsoMatch?: string }
type NavSection = { divider: string; items: NavItem[] }
type NavEntry = NavItem | NavSection

const nav: NavEntry[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/analytics',
    label: 'Analitik',
    icon: <ChartPieIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/session-requests',
    label: 'Jadwal',
    icon: <CalendarDaysIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/classes',
    label: 'Kelas',
    alsoMatch: '/admin/sessions',
    icon: <PresentationChartBarIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/curriculum',
    label: 'Kurikulum',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/materi-latihan-soal',
    label: 'Materi dan Soal',
    icon: <BookOpenIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/subscriptions',
    label: 'Langganan',
    icon: <TicketIcon className="w-5 h-5" />,
  },
  {
    divider: 'Laporan Belajar',
    items: [
      {
        href: '/admin/laporan-bulanan',
        label: 'Progres Kelas',
        icon: <DocumentChartBarIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/rekap-penguasaan',
        label: 'Latihan Mandiri',
        icon: <PencilSquareIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/misi',
        label: 'Ketuntasan Materi',
        icon: <FlagIcon className="w-5 h-5" />,
      },
    ],
  },
  {
    divider: 'Manajemen Pengguna',
    items: [
      {
        href: '/admin/siswa',
        label: 'Siswa',
        alsoMatch: undefined,
        icon: <AcademicCapIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/tutor',
        label: 'Tutor',
        alsoMatch: undefined,
        icon: <UserGroupIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/admin',
        label: 'Admin',
        alsoMatch: undefined,
        icon: <ShieldCheckIcon className="w-5 h-5" />,
      },
    ],
  },
  {
    divider: 'Keuangan',
    items: [
      {
        href: '/admin/finance',
        label: 'Laba Rugi',
        icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/payroll-review',
        label: 'Review Gaji Sesi',
        icon: <CheckBadgeIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/payslips',
        label: 'Slip Gaji Tutor',
        icon: <BanknotesIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/invoices',
        label: 'Invoice',
        icon: <DocumentTextIcon className="w-5 h-5" />,
      },
    ],
  },
  {
    divider: 'Pengaturan',
    items: [
      {
        href: '/admin/rates',
        label: 'Tarif Gaji Tutor',
        icon: <ReceiptPercentIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/billing-rates',
        label: 'Tarif Bimbel',
        icon: <TagIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/libur',
        label: 'Kalender Libur',
        icon: <SunIcon className="w-5 h-5" />,
      },
      {
        href: '/admin/subjects',
        label: 'Mata Pelajaran',
        icon: <BookmarkSquareIcon className="w-5 h-5" />,
      },
    ],
  },
  {
    href: '/admin/announcements',
    label: 'Pengumuman',
    icon: <MegaphoneIcon className="w-5 h-5" />,
  },
]

function NavLink({ href, label, icon, alsoMatch, pathname, searchParams }: NavItem & { pathname: string; searchParams: URLSearchParams }) {
  const [hrefPath, hrefQuery] = href.split('?')
  const hrefParams = new URLSearchParams(hrefQuery ?? '')
  const hrefRole = hrefParams.get('role')
  const currentRole = searchParams.get('role') ?? ''

  let isActive: boolean
  if (hrefPath === '/admin') {
    isActive = pathname === '/admin'
  } else if (hrefRole !== null) {
    isActive = pathname.startsWith(hrefPath) && currentRole === hrefRole
  } else {
    isActive = pathname.startsWith(hrefPath) || (!!alsoMatch && pathname.startsWith(alsoMatch))
  }
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-blue-50/50'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Bimbel Tera" width={28} height={28} />
          <span className="text-lg font-bold text-gray-900">Bimbel Tera</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Panel Admin</p>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {nav.map((entry, i) => {
          if ('divider' in entry) {
            return (
              <div key={entry.divider} className={`${i > 0 ? 'mt-4' : ''}`}>
                <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {entry.divider}
                </p>
                {entry.items.map(item => (
                  <NavLink key={item.href} {...item} pathname={pathname} searchParams={searchParams} />
                ))}
              </div>
            )
          }
          return <NavLink key={entry.href} {...entry} pathname={pathname} searchParams={searchParams} />
        })}
      </nav>
    </aside>
  )
}
