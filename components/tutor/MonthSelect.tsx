'use client'

import { useRouter } from 'next/navigation'

interface Props {
  months: { value: string; label: string }[]
  value: string
}

export default function MonthSelect({ months, value }: Props) {
  const router = useRouter()

  return (
    <select
      value={value}
      onChange={e => router.push(`/tutor/salary?tab=rekap&month=${e.target.value}`)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="all">Semua Bulan</option>
      {months.map(m => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  )
}
