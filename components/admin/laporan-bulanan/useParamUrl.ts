'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * `useState` yang nilainya ikut tertulis di alamat halaman (`?cari=…`).
 *
 * Tabel laporan menyimpan urutan, pencarian, dan filter. Tanpa ini semuanya
 * hidup di memori halaman, jadi membuka rincian seorang siswa lalu menekan
 * kembali mengembalikan tabel ke keadaan awal — admin yang memeriksa banyak
 * siswa berurutan harus menyaring ulang tiap kali.
 *
 * Yang ditulis `replaceState`, bukan `push`: mengetik di kolom cari tidak boleh
 * menambah entri riwayat satu per huruf. Nilai bawaan tidak ditulis supaya
 * alamat tetap bersih. Next menyinkronkan `replaceState` bawaan peramban dengan
 * `useSearchParams` tanpa memuat ulang data server.
 */
export function useParamUrl<T extends string>(
  nama: string,
  awal: T,
): [T, (v: T | ((sebelum: T) => T)) => void] {
  const sp = useSearchParams()
  const [nilai, setNilai] = useState<T>(() => (sp.get(nama) as T | null) ?? awal)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (nilai === awal) url.searchParams.delete(nama)
    else url.searchParams.set(nama, nilai)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url.toString())
  }, [nilai, awal, nama])

  const ubah = useCallback((v: T | ((sebelum: T) => T)) => setNilai(v), [])
  return [nilai, ubah]
}
