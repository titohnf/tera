'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Menampilkan satu materi interaktif (halaman HTML mandiri) di dalam iframe.
 *
 * `sandbox="allow-scripts"` TANPA `allow-same-origin`: skrip materi berjalan
 * di origin buram, jadi tidak bisa membaca cookie atau sesi Tera. Karena itu
 * iframe juga tidak boleh menavigasi halaman induk; tombol "Ayo berlatih" di
 * dalamnya mengirim pesan `ayo-berlatih`, dan komponen ini yang berpindah ke
 * `hrefLatihan`. Pesan hanya dipercaya bila datang dari iframe ini sendiri
 * (`event.source`), bukan dari jendela mana pun.
 */
export default function PenampilMateri({
  html,
  judul,
  hrefLatihan,
}: {
  html: string
  judul: string
  hrefLatihan: string
}) {
  const router = useRouter()
  const bingkai = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function terima(e: MessageEvent) {
      if (e.source !== bingkai.current?.contentWindow) return
      if (e.data && e.data.type === 'ayo-berlatih') router.push(hrefLatihan)
    }
    window.addEventListener('message', terima)
    return () => window.removeEventListener('message', terima)
  }, [router, hrefLatihan])

  return (
    <iframe
      ref={bingkai}
      title={judul}
      srcDoc={html}
      sandbox="allow-scripts"
      className="w-full h-[85vh] rounded-2xl border border-gray-200 bg-white"
    />
  )
}
