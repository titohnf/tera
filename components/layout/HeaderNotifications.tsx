'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export type NotificationItem = {
  id: string
  title: string
  subtitle: string
  createdAt: string
  href: string
}

const SEEN_STORAGE_KEY = 'tera-notif-seen-ids'

function loadSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function HeaderNotifications({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeenIds(loadSeenIds())
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function markSeen(id: string) {
    setSeenIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      try {
        window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // localStorage unavailable — dot just won't persist, non-critical
      }
      return next
    })
  }

  const count = items.length
  const unseenCount = items.filter(item => !seenIds.has(item.id)).length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unseenCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/5 py-1 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Pemberitahuan</p>
          </div>

          {count === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-400">Tidak ada pemberitahuan.</p>
          ) : (
            <div className="py-1 max-h-96 overflow-y-auto">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => { markSeen(item.id); setOpen(false) }}
                  className="flex items-start gap-2 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                >
                  {!seenIds.has(item.id) && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{item.subtitle}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimestamp(item.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
