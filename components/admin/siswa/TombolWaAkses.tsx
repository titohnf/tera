'use client'

import { useState, useTransition } from 'react'
import { tandaiAksesDikirim } from '@/lib/actions/admin/users'

/**
 * Tombol "Kirim Akses ke WhatsApp Orang Tua". Hasil dari `siapkanWaAkses`.
 *
 * Hanya dipakai sekali per siswa: begitu diklik, siswa ditandai sudah dikirimi
 * dan tombolnya hilang. Siswa yang sudah ditandai tidak menampilkan tombol; yang
 * tersisa baris kecil dengan tanggalnya dan tautan "Kirim ulang" — untuk orang
 * tua yang kehilangan pesannya atau baru direset passwordnya.
 */
export default function TombolWaAkses({
  studentId,
  href,
  alasan,
  terkirimPada,
}: {
  studentId: string
  href: string | null
  alasan: string | null
  terkirimPada: string | null
}) {
  const [terkirim, setTerkirim] = useState<string | null>(terkirimPada)
  const [kirimUlang, setKirimUlang] = useState(false)
  const [, mulai] = useTransition()

  if (terkirim && !kirimUlang) {
    const tgl = new Date(terkirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return (
      <p className="text-xs text-gray-400">
        Akses portal sudah dikirim ke orang tua ({tgl}).{' '}
        {href && (
          <button type="button" onClick={() => setKirimUlang(true)} className="text-blue-600 hover:underline">
            Kirim ulang
          </button>
        )}
      </p>
    )
  }

  if (!href) {
    return (
      <div>
        <span className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
          Kirim Akses ke WhatsApp Orang Tua
        </span>
        {alasan && <p className="text-xs text-gray-400 mt-1">{alasan}</p>}
      </div>
    )
  }

  return (
    <div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          // Ditandai saat diklik, tidak menunggu WhatsApp: pesannya dikirim di
          // aplikasi lain dan tidak ada kabar baliknya.
          mulai(async () => {
            const hasil = await tandaiAksesDikirim(studentId)
            if (!hasil) {
              setTerkirim(new Date().toISOString())
              setKirimUlang(false)
            }
          })
        }}
        className="flex items-center justify-center w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Kirim Akses ke WhatsApp Orang Tua
      </a>
      <p className="text-xs text-gray-400 mt-1">
        Berisi password default. Pastikan akun sudah direset ke default sebelum dikirim.
      </p>
    </div>
  )
}
