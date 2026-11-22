'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Memuat ulang data halaman admin secara berkala (tanpa menghilangkan urutan dan saringan di alamat),
 * supaya rekap bisa dibiarkan terbuka selama try out berlangsung. Berhenti saat tab tidak terlihat dan
 * bawaannya mati dan bisa dinyalakan. `router.refresh()` hanya mengambil ulang data server; posisi gulir tetap.
 */
export default function SegarkanOtomatis({ detik = 15, diperbaruiPada }: { detik?: number; diperbaruiPada: string }) {
  const router = useRouter()
  // Mati secara bawaan: dinyalakan hanya saat try out sedang berlangsung.
  const [aktif, setAktif] = useState(false)
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    if (!aktif) return
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setSibuk(true)
      router.refresh()
      setTimeout(() => setSibuk(false), 1200)
    }, detik * 1000)
    return () => clearInterval(t)
  }, [aktif, detik, router])

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      <span className="inline-flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${aktif ? (sibuk ? 'animate-pulse bg-amber-500' : 'bg-green-500') : 'bg-gray-300'}`} aria-hidden />
        {aktif ? `Diperbarui otomatis tiap ${detik} detik` : 'Pembaruan otomatis mati'} · data pukul {diperbaruiPada} WIB
      </span>
      <button type="button" onClick={() => setAktif((a) => !a)} className="underline hover:text-gray-800">
        {aktif ? 'Matikan' : 'Nyalakan'}
      </button>
      <button type="button" onClick={() => router.refresh()} className="underline hover:text-gray-800">
        Muat sekarang
      </button>
    </div>
  )
}
