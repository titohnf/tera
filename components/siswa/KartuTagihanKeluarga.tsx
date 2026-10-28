'use client'

import { useState } from 'react'
import { statusTagihan, tanggalBayarTerakhir } from '@/lib/tagihan'
import { hitungPembayaran, urutkanPembayaran } from '@/components/invoices/PembayaranBlok'
import MenuTitikTiga, { ItemMenu } from '@/components/invoices/MenuTitikTiga'
import { stripClassUniqueTag } from '@/lib/format-class-name'
import type { PembayaranRow, TagihanRow } from '@/components/siswa/TagihanList'

/**
 * Kartu tagihan untuk portal keluarga.
 *
 * Ditulis terpisah dari kartu admin karena yang dicari dua pembacanya berbeda:
 * admin memindai banyak invoice sekaligus, orang tua membaca satu-dua dan ingin
 * tahu "berapa lagi yang harus saya bayar". Karena itu angka yang paling besar
 * adalah SISA, bukan total — total dan yang sudah dibayar jadi keterangan di
 * bawah bilah, masing-masing satu kali saja.
 *
 * Urutan isinya sama di setiap kartu: siapa (kelas, nomor, status) → berapa
 * (sisa, bilah, dibayar/total) → apa yang bisa dilakukan (lihat invoice) →
 * riwayat pembayaran yang bisa dibuka. Tiap kartu hanya punya satu tombol,
 * "Lihat invoice"; segala yang sifatnya unduh ada di menu titik tiga.
 */

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function tanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

function IkonUnduh() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function IkonLihat() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.5" strokeWidth={2} />
    </svg>
  )
}

export default function KartuTagihanKeluarga({
  invoice,
  pembayaran,
  hariIni,
}: {
  invoice: TagihanRow
  pembayaran: PembayaranRow[]
  hariIni: string
}) {
  const lunas = invoice.status === 'paid'
  const batal = invoice.status === 'cancelled'
  // Yang belum lunas langsung terbuka: cicilan dan sisanya yang dicari orang tua.
  const [terbuka, setTerbuka] = useState(!lunas && !batal)

  const terakhir = tanggalBayarTerakhir(pembayaran)
  const st = statusTagihan(invoice.status, invoice.due_date, hariIni, terakhir)
  const { dibayar, kurang, persen } = hitungPembayaran(invoice.total_due, pembayaran)
  const total = Number(invoice.total_due)
  const adaSisa = kurang > 0 && !lunas
  const urut = [...urutkanPembayaran(pembayaran)].reverse() // terbaru di atas

  return (
    <article className="bg-white rounded-2xl border border-slate-200">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Siapa: kelas jadi judul, nomornya keterangan. Lencana status di
            ujung kanan — hal pertama yang dicari, tapi bukan yang terbesar. */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {invoice.classes?.name ? stripClassUniqueTag(invoice.classes.name) : 'Tanpa kelas'}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 font-mono truncate">
              {invoice.invoice_number ?? '—'}
            </p>
          </div>
          <span className={`shrink-0 whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-lg ${st.cls}`}>
            {st.label}
          </span>
        </div>

        {/* Berapa: sisa adalah angka besar. Invoice lunas menampilkan totalnya,
            karena tak ada lagi sisa yang perlu dibaca. */}
        <div>
          <p className="text-xs text-gray-400">{adaSisa ? 'Belum dibayar' : 'Total tagihan'}</p>
          <p
            className={`mt-0.5 text-2xl font-semibold tabular-nums ${adaSisa ? 'text-red-600' : 'text-gray-900'}`}
          >
            {rupiah(adaSisa ? kurang : total)}
          </p>

          <div
            className={`mt-3 h-2 rounded-full overflow-hidden ${adaSisa ? 'bg-red-100' : 'bg-green-500'}`}
            role="img"
            aria-label={`${persen}% sudah dibayar`}
          >
            <div className="h-full bg-green-500 transition-all" style={{ width: `${persen}%` }} />
          </div>

          {/* Label 12px di atas, nilainya 14px — keterangan di bawah bilah
              adalah angka yang dibaca, bukan catatan kaki. */}
          <dl className="mt-3 flex items-start justify-between gap-3">
            <div>
              <dt className="text-xs text-gray-400">Sudah dibayar</dt>
              <dd className="text-sm font-medium text-green-600 tabular-nums">{rupiah(dibayar)}</dd>
            </div>
            {adaSisa && (
              <div className="text-right">
                <dt className="text-xs text-gray-400">Total tagihan</dt>
                <dd className="text-sm font-medium text-gray-700 tabular-nums">{rupiah(total)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Apa yang bisa dilakukan: satu tombol, dan menu untuk unduh. */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/invoices/${invoice.id}/pdf?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none sm:px-8 inline-flex items-center justify-center min-h-11 px-4 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Lihat invoice
          </a>
          <MenuTitikTiga label="Aksi tagihan">
            {tutup => (
              <ItemMenu href={`/api/invoices/${invoice.id}/pdf`} onClick={tutup} ikon={<IkonUnduh />}>
                Unduh PDF
              </ItemMenu>
            )}
          </MenuTitikTiga>
        </div>
      </div>

      {/* Riwayat: satu baris pembuka, lalu daftar yang tiap barisnya hanya
          punya satu titik tiga (lihat atau unduh kuitansi). */}
      <button
        type="button"
        onClick={() => setTerbuka(v => !v)}
        aria-expanded={terbuka}
        className="w-full min-h-12 px-4 sm:px-5 flex items-center justify-between gap-2 border-t border-slate-100 text-sm text-gray-600 hover:bg-slate-50 rounded-b-2xl transition-colors"
      >
        <span>
          Riwayat pembayaran
          <span className="ml-1.5 text-gray-400">({urut.length})</span>
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${terbuka ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {terbuka && (
        <div className="border-t border-slate-100">
          {urut.length === 0 ? (
            <p className="px-4 sm:px-5 py-4 text-sm text-gray-400">Belum ada pembayaran tercatat.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {urut.map((p, i) => (
                <li key={p.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">Tahap {urut.length - i}</p>
                    <p className="text-xs text-gray-400">{tanggal(p.paid_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-medium text-gray-800 tabular-nums">
                      {rupiah(Number(p.amount))}
                    </span>
                    <MenuTitikTiga label="Aksi pembayaran">
                      {tutup => (
                        <>
                          <ItemMenu
                            href={`/api/invoices/${invoice.id}/kuitansi/${p.id}/pdf?preview=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={tutup}
                            ikon={<IkonLihat />}
                          >
                            Lihat kuitansi
                          </ItemMenu>
                          <ItemMenu
                            href={`/api/invoices/${invoice.id}/kuitansi/${p.id}/pdf`}
                            onClick={tutup}
                            ikon={<IkonUnduh />}
                          >
                            Unduh kuitansi
                          </ItemMenu>
                        </>
                      )}
                    </MenuTitikTiga>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}
