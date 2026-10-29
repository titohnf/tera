'use client'

import { useState, useTransition } from 'react'
import { sinkronkanSoalSekarang } from '@/lib/actions/admin/soal-sinkron'
import type { HasilSinkronSoal } from '@/lib/soal-digital-sinkron'

export type RingkasanSoal = {
  selesai: number
  tanpaTopik: { nama: string; jalur: string }[]
  perluTinjauan: { nama: string; catatan: string | null }[]
  galat: { nama: string; catatan: string | null }[]
  terakhir: string | null
}

function tanggalWib(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/**
 * Soal digital dari Google Form di Drive: kuis draf di Sora dan butir bank soal
 * draf untuk menu Belajar. Terpisah dari kelengkapan jurnal tutor — tutor
 * tetap memakai Google Form dan mengisi nilai manual semester ini.
 */
export default function SinkronSoalPanel({ ringkasan }: { ringkasan: RingkasanSoal }) {
  const [sedang, mulai] = useTransition()
  const [hasil, setHasil] = useState<HasilSinkronSoal | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  function jalankan() {
    setGalat(null)
    mulai(async () => {
      const r = await sinkronkanSoalSekarang()
      if ('error' in r) { setHasil(null); setGalat(r.error) } else setHasil(r.hasil)
    })
  }

  const tanpaTopik = hasil?.tanpaTopik ?? ringkasan.tanpaTopik
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Soal digital dari Google Form</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Form asesmen di Drive dibuat otomatis menjadi soal draf (kuis Sora dan butir untuk menu Belajar), tiap hari pukul 03.30 WIB.
          Semester ini tidak memengaruhi jurnal tutor. Butir baru berstatus draf: aktifkan di Sora sesudah dibaca.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button" onClick={jalankan} disabled={sedang}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {sedang ? 'Membaca form…' : 'Buat soal digital dari Drive sekarang'}
        </button>
        <span className="text-xs text-gray-500">
          {ringkasan.selesai} form sudah diproses
          {ringkasan.terakhir ? ` · terakhir ${tanggalWib(ringkasan.terakhir)} WIB` : ' · belum pernah dijalankan'}
          {sedang && ' · bisa 1–2 menit untuk 40 form'}
        </span>
      </div>

      {galat && <p className="text-sm text-red-600">Gagal: {galat}</p>}

      {hasil && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-green-600">{hasil.dibuat} form baru, {hasil.diperbarui} diperbarui</span>
          {' · '}{hasil.butirBaru} butir bank soal baru
          {hasil.antrean > 0 && <span className="text-gray-500"> · {hasil.antrean} form masih antre (tekan lagi)</span>}
          {hasil.dilewati.length > 0 && <span className="text-gray-500"> · {hasil.dilewati.length} dilewati</span>}
          {hasil.galat.length > 0 && <span className="text-red-600"> · {hasil.galat.length} galat</span>}
        </p>
      )}

      {tanpaTopik.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-amber-700">
            {tanpaTopik.length} form belum bisa dipasangkan ke topik kurikulum (jadi kuis saja, belum ada di Belajar)
          </summary>
          <p className="mt-1 text-xs text-gray-500">
            Beri kode topik di nama form (mis. &ldquo;… [t-9f3a2c]&rdquo;; kode ada di tabel Kurikulum), atau tambahkan satu
            baris di <code>lib/soal-pemetaan.json</code>. Topiknya tidak pernah ditebak.
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600 max-h-48 overflow-y-auto">
            {tanpaTopik.map(t => <li key={t.nama}>{t.nama}</li>)}
          </ul>
        </details>
      )}
      {(hasil?.perluTinjauan.length ?? ringkasan.perluTinjauan.length) > 0 && (
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-red-700">Form berubah, hasil lamanya sudah dipakai — tinjau manual</summary>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
            {(hasil ? hasil.perluTinjauan.map(p => ({ nama: p.nama })) : ringkasan.perluTinjauan).map(p => <li key={p.nama}>{p.nama}</li>)}
          </ul>
        </details>
      )}
      {(hasil?.galat.length ?? ringkasan.galat.length) > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-red-700">Form yang gagal diproses (dicoba lagi otomatis)</summary>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
            {(hasil ? hasil.galat.map(g => ({ nama: g.nama, catatan: g.alasan })) : ringkasan.galat).map(g => <li key={g.nama}>{g.nama}: {g.catatan}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}
