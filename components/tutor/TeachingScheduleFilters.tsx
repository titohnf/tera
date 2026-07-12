'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Props {
  classId: string
  teachStatus: string
  classes: { id: string; name: string }[]
}

export default function TeachingScheduleFilters({ classId, teachStatus, classes }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(overrides: Record<string, string>) {
    const params: Record<string, string> = {
      ...(classId ? { classId } : {}),
      ...(teachStatus ? { teachStatus } : {}),
      ...overrides,
    }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const qs = new URLSearchParams(params).toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const hasFilter = !!(classId || teachStatus)

  const selectCls = (active: boolean) =>
    `text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      active ? 'border-blue-500 text-blue-700' : 'border-gray-200 text-gray-700'
    }`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={classId} onChange={e => router.push(buildUrl({ classId: e.target.value }))} className={selectCls(!!classId)}>
        <option value="">Semua Kelas</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select value={teachStatus} onChange={e => router.push(buildUrl({ teachStatus: e.target.value }))} className={selectCls(!!teachStatus)}>
        <option value="">Semua Status</option>
        <option value="scheduled">Terjadwal</option>
        <option value="completed">Selesai</option>
        <option value="cancelled">Dibatalkan</option>
      </select>

      {hasFilter && (
        <a href={pathname} className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
          Reset
        </a>
      )}
    </div>
  )
}
