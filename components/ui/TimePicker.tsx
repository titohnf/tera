'use client'
import { useState, useRef, useEffect } from 'react'

const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function TimePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [h, m] = value ? value.split(':') : ['', '']

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const setH = (val: string) => onChange(`${val}:${m || '00'}`)
  const setM = (val: string) => onChange(`${h || '06'}:${val}`)

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[96px]"
      >
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || '--:--'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 text-center">Jam</p>
            <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto">
              {HOURS.map(hr => (
                <button key={hr} type="button"
                  onClick={() => setH(hr)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    h === hr ? 'bg-blue-600 text-white' : 'hover:bg-blue-50/50 text-gray-700'
                  }`}
                >{hr}</button>
              ))}
            </div>
          </div>
          <span className="text-gray-300 font-semibold text-lg mt-6">:</span>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 text-center">Menit</p>
            <div className="flex flex-col gap-0.5">
              {MINUTES.map(mn => (
                <button key={mn} type="button"
                  onClick={() => { setM(mn); setOpen(false) }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    m === mn ? 'bg-blue-600 text-white' : 'hover:bg-blue-50/50 text-gray-700'
                  }`}
                >{mn}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
