'use client'

import { useState } from 'react'

export default function ProfileAccordion({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left group"
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Profil</p>
        <svg
          className={`w-3.5 h-3.5 text-gray-300 transition-transform group-hover:text-gray-400 ${open ? '' : '-rotate-90'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}
