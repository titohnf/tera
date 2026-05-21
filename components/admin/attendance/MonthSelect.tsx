'use client'

type Option = { value: string; label: string }

export default function MonthSelect({ options, value }: { options: Option[]; value: string }) {
  return (
    <select
      value={value}
      onChange={e => {
        const url = new URL(window.location.href)
        url.searchParams.set('month', e.target.value)
        url.searchParams.delete('class_id')
        window.location.href = url.toString()
      }}
      className="pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map(m => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  )
}
