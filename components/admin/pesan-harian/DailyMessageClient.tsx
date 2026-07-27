'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildWhatsappShareUrl } from '@/lib/daily-message'

export default function DailyMessageClient({
  date,
  message,
}: {
  date: string
  message: string
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  function handleDateChange(newDate: string) {
    router.push(`/admin/pesan-harian?date=${newDate}`)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700" htmlFor="pesan-harian-date">
          Tanggal
        </label>
        <input
          id="pesan-harian-date"
          type="date"
          value={date}
          onChange={e => handleDateChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      <textarea
        readOnly
        value={message}
        rows={Math.max(10, message.split('\n').length + 1)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 bg-gray-50 resize-none"
      />

      <div className="mt-3 flex items-center gap-2">
        <a
          href={buildWhatsappShareUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Buka WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? 'Tersalin!' : 'Salin Pesan'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Klik &quot;Buka WhatsApp&quot; untuk langsung memilih kontak/grup tujuan, atau salin teksnya untuk ditempel manual.
      </p>
    </div>
  )
}
