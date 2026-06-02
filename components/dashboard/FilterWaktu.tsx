'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { PERIODS, type Period } from '@/lib/dateRange'

export default function FilterWaktu({ currentPeriod }: { currentPeriod: Period }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1.5 flex-wrap">
      {PERIODS.map(tab => (
        <Link
          key={tab.key}
          href={`${pathname}?period=${tab.key}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            currentPeriod === tab.key
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
