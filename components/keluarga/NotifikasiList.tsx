'use client'

import Link from 'next/link'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { JenisNotif, NotifKeluarga } from '@/lib/keluarga-notifikasi'
import {
  langganan,
  snapshotServer,
  snapshotTerbaca,
  tandaiTerbaca,
  urai,
} from '@/lib/notif-terbaca'

/**
 * Daftar notifikasi keluarga, beserta penanda "baru sejak kunjungan terakhir".
 *
 * Penandanya di localStorage lewat `lib/notif-terbaca` — simpanan yang sama
 * dengan yang dihitung lencana di bilah navigasi bawah, supaya angka di lonceng
 * turun begitu daftarnya dibaca.
 *
 * Yang terlihat adalah himpunan "sudah dibaca" pada saat halaman DIBUKA, lalu
 * seluruh isi layar ditandai terbaca. Kalau penandaannya dilakukan sebelum
 * render, membuka halaman ini akan menghapus titiknya sebelum sempat dibaca —
 * dan kabar yang tidak pernah terlihat baru sama saja dengan tidak ada.
 *
 * Bacaannya lewat `useSyncExternalStore`, bukan `useState` + efek. localStorage
 * tidak ada di server, jadi render pertama HARUS menganggap semuanya terbaca
 * agar hasil hidrasi sama dengan HTML dari server — itulah gunanya
 * `snapshotServer`. Menyetel state dari dalam efek memberi hasil yang sama tapi
 * lewat render berantai, dan `react-hooks/set-state-in-effect` melarangnya.
 */

const IKON: Record<JenisNotif, { d: string; warna: string }> = {
  'sesi-batal': {
    d: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warna: 'bg-red-50 text-red-500',
  },
  'sesi-baru': {
    d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    warna: 'bg-blue-50 text-blue-600',
  },
  'tagihan-terbit': {
    d: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
    warna: 'bg-slate-100 text-slate-600',
  },
  'tagihan-jatuh-tempo': {
    d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    warna: 'bg-amber-50 text-amber-600',
  },
  laporan: {
    d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    warna: 'bg-emerald-50 text-emerald-600',
  },
}

/**
 * "3 hari lagi" / "kemarin" / "2 minggu lalu".
 *
 * `sekarangIso` datang dari server, bukan dari `Date.now()` di sini: jam
 * perangkat pembaca dan jam server tidak sama, dan menghitungnya di dua sisi
 * membuat HTML hasil render server berbeda dengan hasil hidrasi.
 */
function labelWaktu(waktu: string, sekarangIso: string): string {
  const selisihHari = Math.round(
    (Date.parse(waktu) - Date.parse(sekarangIso)) / 86_400_000,
  )
  if (selisihHari > 1) return `${selisihHari} hari lagi`
  if (selisihHari === 1) return 'besok'
  if (selisihHari === 0) return 'hari ini'
  if (selisihHari === -1) return 'kemarin'
  if (selisihHari > -30) return `${-selisihHari} hari lalu`
  return new Date(waktu).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  })
}

export default function NotifikasiList({
  items,
  sekarangIso,
}: {
  items: NotifKeluarga[]
  sekarangIso: string
}) {
  const mentah = useSyncExternalStore(langganan, snapshotTerbaca, snapshotServer)
  const terbaca = useMemo(() => urai(mentah), [mentah])

  useEffect(() => {
    tandaiTerbaca(items.map((it) => it.id))
  }, [items])

  return (
    <ul className="divide-y divide-gray-100">
      {items.map((it) => {
        const ikon = IKON[it.jenis]
        // Saat hidrasi `terbaca` masih null dan tidak ada yang ditandai baru —
        // render server dan render pertama di browser harus sama.
        const baru = terbaca !== null && !terbaca.has(it.id)
        return (
          <li key={it.id}>
            <Link href={it.href} className="flex gap-3 p-4 active:bg-gray-50 transition-colors">
              <span
                className={`shrink-0 w-9 h-9 rounded-full grid place-items-center ${ikon.warna}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ikon.d} />
                </svg>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-2">
                  <span
                    className={`text-sm leading-snug ${
                      baru ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                    }`}
                  >
                    {it.judul}
                  </span>
                  {baru && (
                    <span
                      className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-600"
                      aria-label="Belum dibaca"
                    />
                  )}
                </span>
                {it.rincian && (
                  <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {it.rincian}
                  </span>
                )}
                <span className="block text-xs text-gray-400 mt-1">
                  {labelWaktu(it.waktu, sekarangIso)}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
