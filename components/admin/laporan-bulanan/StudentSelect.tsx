'use client'

type Option = { value: string; label: string }

export default function StudentSelect({ options, value }: { options: Option[]; value: string }) {
  return (
    <select
      value={value}
      onChange={e => {
        const url = new URL(window.location.href)
        if (e.target.value) url.searchParams.set('student_id', e.target.value)
        else url.searchParams.delete('student_id')
        window.location.href = url.toString()
      }}
      className="pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[240px]"
    >
      <option value="">Pilih siswa…</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
