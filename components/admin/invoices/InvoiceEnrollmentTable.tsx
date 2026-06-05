'use client'

import { useState } from 'react'
import Link from 'next/link'

export type EnrollmentRow = {
  studentId: string
  studentName: string
  classId: string
  className: string
  classPrice: number
  kekurangan: number
  status: 'lunas' | 'angsuran' | 'menunggu'
}

const CLASS_STATUS_BADGE: Record<string, string> = {
  lunas:    'bg-green-100 text-green-700',
  angsuran: 'bg-yellow-100 text-yellow-700',
  menunggu: 'bg-gray-100 text-gray-500',
}

const CLASS_STATUS_LABEL: Record<string, string> = {
  lunas:    'Lunas',
  angsuran: 'Angsuran',
  menunggu: 'Menunggu',
}

const STATUS_ORDER = { menunggu: 0, angsuran: 1, lunas: 2 }

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

type SortKey = 'studentName' | 'className' | 'classPrice' | 'status'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-0.5">
      <svg
        className={`w-1.5 h-1.5 transition-colors ${active && dir === 'asc' ? 'text-gray-700' : 'text-gray-300'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg
        className={`w-1.5 h-1.5 transition-colors ${active && dir === 'desc' ? 'text-gray-700' : 'text-gray-300'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  )
}

interface Props {
  rows: EnrollmentRow[]
}

export default function InvoiceEnrollmentTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('studentName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'studentName') cmp = a.studentName.localeCompare(b.studentName, 'id')
    else if (sortKey === 'className') cmp = a.className.localeCompare(b.className, 'id')
    else if (sortKey === 'classPrice') cmp = a.classPrice - b.classPrice
    else if (sortKey === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    return sortDir === 'asc' ? cmp : -cmp
  })

  function thProps(key: SortKey, align: 'left' | 'right' = 'left') {
    return {
      onClick: () => handleSort(key),
      className: `px-${align === 'right' ? '4' : key === 'studentName' ? '5' : '4'} py-3 text-${align} cursor-pointer select-none hover:text-gray-700 transition-colors`,
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          {rows.length} Enrollment
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10 px-5">Tidak ada data yang sesuai.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th {...thProps('studentName')}>
                <span className="inline-flex items-center">
                  Nama Siswa
                  <SortIcon active={sortKey === 'studentName'} dir={sortDir} />
                </span>
              </th>
              <th {...thProps('className')}>
                <span className="inline-flex items-center">
                  Kelas
                  <SortIcon active={sortKey === 'className'} dir={sortDir} />
                </span>
              </th>
              <th {...thProps('classPrice', 'right')}>
                <span className="inline-flex items-center justify-end w-full">
                  Nilai Invoice
                  <SortIcon active={sortKey === 'classPrice'} dir={sortDir} />
                </span>
              </th>
              <th {...thProps('status')}>
                <span className="inline-flex items-center">
                  Status
                  <SortIcon active={sortKey === 'status'} dir={sortDir} />
                </span>
              </th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map(row => (
              <tr key={`${row.studentId}__${row.classId}`} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/admin/invoices/siswa/${row.studentId}`} className="block font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {row.studentName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <Link href={`/admin/invoices/siswa/${row.studentId}`} className="block">
                    {row.className}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/invoices/siswa/${row.studentId}`} className="block font-medium text-gray-900">
                    {row.classPrice > 0 ? formatRupiah(row.classPrice) : '—'}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/invoices/siswa/${row.studentId}`} className="block">
                    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-lg ${CLASS_STATUS_BADGE[row.status]}`}>
                      {CLASS_STATUS_LABEL[row.status]}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/invoices/siswa/${row.studentId}`} className="inline-block">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
