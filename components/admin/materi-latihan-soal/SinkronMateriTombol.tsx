'use client'

import { useState, useTransition } from 'react'
import { sinkronkanMateriSekarang } from '@/lib/actions/admin/materi-sinkron'
import type { HasilSinkron } from '@/lib/materi-pemetaan'

/**
 * "Sinkronkan dengan Drive sekarang" — menjalankan yang sama dengan skrip
 * `sinkron-materi-drive.mjs` dan tugas harian, tanpa perlu terminal. Hasilnya
 * ditulis terang: berapa yang didaftarkan, dan — yang paling berguna — daftar
 * kerja yang tersisa, karena yang tidak cocok pasti tidak pernah ditebak.
 */
export default function SinkronMateriTombol({ otomatis }: { otomatis: boolean }) {
  const [sedang, mulai] = useTransition()
  const [hasil, setHasil] = useState<HasilSinkron | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  function jalankan() {
    setGalat(null)
    mulai(async () => {
      const r = await sinkronkanMateriSekarang()
      if ('error' in r) {
        setHasil(null)
        setGalat(r.error)
      } else {
        setHasil(r.hasil)
      }
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={jalankan}
          disabled={sedang}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {sedang ? 'Menyinkronkan…' : 'Sinkronkan dengan Drive sekarang'}
        </button>
        <span className="text-xs text-gray-500">
          {sedang
            ? 'Membaca folder Drive dan memeriksa tiap materi; bisa memakan beberapa menit.'
            : otomatis
              ? 'Berjalan otomatis tiap hari pukul 03.00 WIB. Tombol ini untuk yang tidak mau menunggu.'
              : 'Tugas harian belum aktif: pasang CRON_SECRET di server. Sementara, jalankan dengan tombol ini.'}
        </span>
      </div>

      {galat && <p className="mt-2 text-sm text-red-600">Gagal: {galat}</p>}

      {hasil && (
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium text-green-600">{hasil.baru.length} materi baru didaftarkan</span>
            {' · '}
            {hasil.pindai.siap} dari {hasil.pindai.total} siap dibaca
            {hasil.pindai.padam > 0 && <span className="text-amber-600"> · {hasil.pindai.padam} berhenti siap</span>}
            {hasil.pindai.tidakPasti > 0 && (
              <span className="text-gray-500"> · {hasil.pindai.tidakPasti} gagal diperiksa (coba lagi)</span>
            )}
          </p>

          {hasil.baru.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs text-gray-500">Yang baru didaftarkan</summary>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                {hasil.baru.map((b, i) => (
                  <li key={i}>{b.judul} → {b.topik}</li>
                ))}
              </ul>
            </details>
          )}

          {hasil.tanpaCocok.length > 0 && (
            <details open>
              <summary className="cursor-pointer text-sm font-medium text-amber-700">
                {hasil.tanpaCocok.length} folder di Drive belum cocok dengan topik mana pun
              </summary>
              <p className="mt-1 text-xs text-gray-500">
                Beri kode topik di nama foldernya (salin dari tabel di bawah), atau buat topiknya di Kurikulum
                dengan nama yang sama. Materi khusus kelas privat taruh di folder &ldquo;Materi Khusus&rdquo;.
              </p>
              <ul className="mt-1 space-y-1 text-xs text-gray-600">
                {hasil.tanpaCocok.map((t) => (
                  <li key={t.jalur}>
                    <span className="font-medium">{t.jalur}</span> ({t.berkas} berkas)
                    {t.saran && <span className="block text-gray-400">terdekat: {t.saran}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {(hasil.ambigu.length > 0 || hasil.kodeAsing.length > 0) && (
            <details open>
              <summary className="cursor-pointer text-sm font-medium text-red-700">Perlu diperbaiki</summary>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                {hasil.ambigu.map((a) => (
                  <li key={a.jalur}>{a.jalur}: cocok dengan lebih dari satu topik ({a.calon.join(' | ')})</li>
                ))}
                {hasil.kodeAsing.map((k) => (
                  <li key={k.jalur}>{k.jalur}: kode {k.kode} tidak dikenal</li>
                ))}
              </ul>
            </details>
          )}

          {hasil.pindai.belum.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs text-gray-500">
                {hasil.pindai.belum.length} materi terdaftar yang belum bisa dibuka anak
              </summary>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                {hasil.pindai.belum.map((b, i) => (
                  <li key={i}>{b.judul} — {b.sebab}</li>
                ))}
              </ul>
            </details>
          )}

          {hasil.hilang.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs text-gray-500">
                {hasil.hilang.length} materi terdaftar yang berkasnya tidak ada lagi di Materi Kurikulum
              </summary>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                {hasil.hilang.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
