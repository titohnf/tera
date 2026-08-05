'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

/** Pemilih kelas yang menulis pilihannya ke query string, jadi halamannya bisa dibagikan. */
export default function ClassPicker({
  classes,
  selected,
}: {
  classes: { id: string; name: string }[]
  selected: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function pick(classId: string) {
    const next = new URLSearchParams(params.toString())
    if (classId) next.set('class', classId)
    else next.delete('class')
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <select
      value={selected ?? ''}
      onChange={e => pick(e.target.value)}
      className="rounded border border-slate-200 px-3 py-2 text-sm"
    >
      <option value="">Pilih kelas…</option>
      {classes.map(cls => (
        <option key={cls.id} value={cls.id}>
          {cls.name}
        </option>
      ))}
    </select>
  )
}
