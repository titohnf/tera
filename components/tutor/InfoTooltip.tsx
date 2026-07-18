'use client'

import { useState } from 'react'

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setOpen(false)}
        className="text-gray-400 hover:text-gray-600 shrink-0"
        aria-label="Info"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-10 top-full left-0 mt-1.5 w-64 bg-gray-900 text-white text-xs leading-snug rounded-lg px-3 py-2 shadow-lg">
          {text}
        </div>
      )}
    </span>
  )
}
