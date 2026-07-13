'use client'

type Option = { value: string; label: string }

export default function MonthFilter({ options, value }: { options: Option[]; value: string }) {
  return (
    <select
      value={value}
      onChange={e => {
        const url = new URL(window.location.href)
        url.searchParams.set('month', e.target.value)
        window.location.href = url.toString()
      }}
      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map(m => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  )
}
