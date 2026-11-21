'use client'

import { useEffect, useState } from 'react'
import { hariWib, jamWib, tanggalWib } from '@/lib/tryout/paket'

/**
 * Tombol "Mulai" sebuah try out yang punya jadwal. Sebelum jamnya, tombol mati dan
 * menampilkan hitung mundur; begitu jamnya tiba, ia menyala sendiri tanpa memuat ulang.
 * Jamnya mengikuti jam SERVER (selisihnya dihitung dari `sekarangServer`), supaya jam HP
 * yang meleset tidak membuka lebih awal atau menahan lebih lama. Yang sebenarnya menahan
 * adalah database (`mulai_percobaan_peserta` memeriksa `opens_at`); tombol ini cuma
 * memberi tahu.
 */
export default function TombolMulai({
  href,
  bukaPada,
  tutupPada,
  sekarangServer,
}: {
  href: string
  bukaPada: string | null
  tutupPada: string | null
  sekarangServer: number
}) {
  const [selisih] = useState(() => sekarangServer - Date.now())
  const [now, setNow] = useState(sekarangServer)
  const buka = bukaPada ? new Date(bukaPada).getTime() : null
  const tutup = tutupPada ? new Date(tutupPada).getTime() : null

  useEffect(() => {
    if (buka === null || Date.now() + selisih >= buka) return
    const t = setInterval(() => {
      const n = Date.now() + selisih
      setNow(n)
      if (n >= buka) clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  }, [buka, selisih])

  if (tutup !== null && now >= tutup) {
    return <span className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-500">Sudah ditutup</span>
  }

  if (buka !== null && now < buka) {
    const sisa = Math.max(0, Math.ceil((buka - now) / 1000))
    const j = Math.floor(sisa / 3600)
    const m = Math.floor((sisa % 3600) / 60)
    const d = sisa % 60
    const hitung = j > 0 ? `${j} jam ${m} menit lagi` : `${String(m).padStart(2, '0')}:${String(d).padStart(2, '0')} lagi`
    const hari = tanggalWib(bukaPada as string) === tanggalWib(now) ? '' : `${hariWib(bukaPada as string)}, `
    return (
      <div className="text-right">
        <button type="button" disabled className="cursor-not-allowed rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-500">
          Mulai
        </button>
        <p className="mt-1 text-xs font-medium text-amber-700">
          Dibuka {hari}pukul {jamWib(bukaPada as string)} WIB · {hitung}
        </p>
      </div>
    )
  }

  return (
    // `<a>`, bukan Link: Sora bukan rute Tera.
    <a href={href} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
      Mulai
    </a>
  )
}
