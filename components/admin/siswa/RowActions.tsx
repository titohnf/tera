'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RowActions({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const items = [
    { label: 'Jadwalkan Sesi', href: `/admin/sessions/new?studentId=${studentId}` },
    { label: 'Buat Invoice', href: `/admin/invoices/new?studentId=${studentId}` },
    { label: 'Lihat Detail', href: `/admin/siswa/${studentId}` },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
        className="opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        aria-label="Aksi"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(item.href) }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
