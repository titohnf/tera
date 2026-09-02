'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Eskalasi } from '@/lib/pengukuran/tutor'
import { jawabEskalasi } from '@/app/tutor/pengukuran/actions'

const WARNA_SLA: Record<Eskalasi['statusSla'], string> = {
  menunggu: 'bg-amber-50 text-amber-700 ring-amber-200',
  terlambat: 'bg-rose-50 text-rose-700 ring-rose-200',
  terpenuhi: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const LABEL_SLA: Record<Eskalasi['statusSla'], string> = {
  menunggu: 'Menunggu respons',
  terlambat: 'Lewat 24 jam kerja',
  terpenuhi: 'Sudah direspons',
}

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Satu eskalasi, beserta kotak jawabannya.
 *
 * YANG TIDAK DITULIS DI KARTU INI: angka Skor Putaran 1 mentah anaknya. Yang
 * ditampilkan cuma bahwa dua paket berturut-turut jatuh di bawah ambang —
 * cukup untuk tahu apa yang terjadi, dan rinciannya ada satu ketukan jauhnya di
 * rapor murid. Kartu eskalasi sering dibuka di tempat yang ada orang lain.
 *
 * Menjawab bukan berarti "selesai", melainkan "sudah saya tangani". Tidak ada
 * tombol menutup atau menghapus: barisnya jejak audit (149), dan yang bisa
 * dihapus bukan jejak.
 */
export default function KartuEskalasi({ eskalasi }: { eskalasi: Eskalasi }) {
  const [catatan, setCatatan] = useState('')
  const [gagal, setGagal] = useState(false)
  const [menyimpan, mulai] = useTransition()

  const sudahDijawab = eskalasi.waktuDirespons !== null

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/tutor/pengukuran/${eskalasi.learnerId}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-700"
          >
            {eskalasi.nama}
          </Link>
          <p className="mt-1 text-sm text-gray-600">
            Dua paket berturut-turut
            {eskalasi.labelPemicu ? ` (${eskalasi.labelPemicu})` : ''} belum mencapai ambang
            {eskalasi.ambangBerlaku !== null
              ? ` ${Math.round(eskalasi.ambangBerlaku * 100)}%`
              : ''}{' '}
            pada percobaan pertamanya.
          </p>
          <p className="mt-1 text-xs text-gray-400">{tanggal(eskalasi.waktuTerkirim)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${WARNA_SLA[eskalasi.statusSla]}`}
        >
          {LABEL_SLA[eskalasi.statusSla]}
        </span>
      </div>

      {sudahDijawab ? (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-gray-500">
            Direspons {tanggal(eskalasi.waktuDirespons!)}
          </p>
          {eskalasi.catatan && (
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{eskalasi.catatan}</p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <textarea
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={2}
            placeholder="Apa yang kamu lakukan untuk murid ini? (mis. dihubungi orang tuanya, dijadwalkan pendampingan)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={menyimpan}
              onClick={() =>
                mulai(async () => {
                  const berhasil = await jawabEskalasi(eskalasi.id, catatan)
                  setGagal(!berhasil)
                })
              }
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {menyimpan ? 'Menyimpan…' : 'Tandai sudah ditangani'}
            </button>
            {gagal && (
              <span className="text-xs text-rose-600">Gagal menyimpan. Coba lagi.</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
