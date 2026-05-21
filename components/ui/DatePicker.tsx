'use client'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { id } from 'date-fns/locale/id'
import { forwardRef } from 'react'

registerLocale('id', id)

interface Props {
  value: string
  onChange: (value: string) => void
  min?: string
  name?: string
  required?: boolean
}

const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
    >
      <span className={value ? 'text-gray-900' : 'text-gray-400'}>
        {value || 'Pilih tanggal'}
      </span>
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  )
)
CustomInput.displayName = 'CustomInput'

export default function DatePicker({ value, onChange, min, name, required }: Props) {
  const selected = value ? new Date(value + 'T00:00:00') : null
  const minDate = min ? new Date(min + 'T00:00:00') : undefined

  return (
    <div className="w-full">
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <ReactDatePicker
        selected={selected}
        onChange={(date: Date | null) => {
          if (date) {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            onChange(`${y}-${m}-${d}`)
          }
        }}
        minDate={minDate}
        dateFormat="dd MMMM yyyy"
        locale="id"
        customInput={<CustomInput />}
        popperClassName="z-50"
        wrapperClassName="w-full"
        calendarClassName="!border-slate-300 !rounded-xl !shadow-lg !font-sans"
      />
    </div>
  )
}
