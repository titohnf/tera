'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Menampilkan satu materi interaktif (halaman HTML mandiri) di dalam iframe.
 *
 * Materi memenuhi SELURUH layar (`fixed inset-0`), di atas kepala dan menu
 * halaman. Alasannya: materi adalah permainan satu layar dengan tombol di
 * dasar (Mulai, Lanjut). Ketika ia hanya diberi sisa ruang di bawah kepala
 * dan judul halaman, tombol itu jatuh di luar layar iframe, dan di dalamnya
 * ada gulir sendiri yang bertumpuk dengan gulir halaman. Satu bilah tipis di
 * atas (tombol kembali dan judul) cukup; tingginya diperhitungkan, dan sisanya
 * `100dvh` supaya tidak terpotong bilah alamat peramban di ponsel.
 *
 * `sandbox="allow-scripts"` TANPA `allow-same-origin`: skrip materi berjalan
 * di origin buram, jadi tidak bisa membaca cookie atau sesi Tera. Karena itu
 * iframe juga tidak boleh menavigasi halaman induk; tombol "Ayo berlatih" di
 * dalamnya mengirim pesan `ayo-berlatih`, dan komponen ini yang berpindah ke
 * `hrefLatihan`. Pesan hanya dipercaya bila datang dari iframe ini sendiri
 * (`event.source`), bukan dari jendela mana pun.
 *
 * `hrefKembali` kosong: tombol kembali memakai riwayat peramban.
 */
export default function PenampilMateri({
  html,
  judul,
  hrefLatihan,
  hrefKembali,
}: {
  html: string
  judul: string
  hrefLatihan: string
  hrefKembali?: string
}) {
  const router = useRouter()
  const bingkai = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function terima(e: MessageEvent) {
      if (e.source !== bingkai.current?.contentWindow) return
      if (e.data && e.data.type === 'ayo-berlatih') router.push(hrefLatihan)
    }
    window.addEventListener('message', terima)
    // Cegah halaman di belakang ikut tergulir selagi materi dimainkan.
    const lama = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('message', terima)
      document.body.style.overflow = lama
    }
  }, [router, hrefLatihan])

  const kelasTombol = 'flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-stone-200 hover:bg-white/10'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#1f1d19]"
      style={{ height: '100dvh' }}
    >
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-2">
        {hrefKembali ? (
          <Link href={hrefKembali} className={kelasTombol}>
            <span aria-hidden>←</span> Kembali
          </Link>
        ) : (
          <button type="button" onClick={() => router.back()} className={kelasTombol}>
            <span aria-hidden>←</span> Kembali
          </button>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-100">{judul}</span>
      </div>
      <iframe
        ref={bingkai}
        title={judul}
        srcDoc={html}
        sandbox="allow-scripts"
        className="w-full flex-1 border-0 bg-[#1f1d19]"
      />
    </div>
  )
}
