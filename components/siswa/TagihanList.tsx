'use client'

import { useState } from 'react'
import { statusTagihan, warnaBilahTagihan } from '@/lib/tagihan'
import {
  KemajuanBayar,
  RiwayatPembayaran,
  type Pembayaran,
} from '@/components/invoices/PembayaranBlok'
import MenuTitikTiga, { ItemMenu } from '@/components/invoices/MenuTitikTiga'
import { stripClassUniqueTag } from '@/lib/format-class-name'

/** Bentuk tombol "Lihat", sama dengan yang dipakai halaman invoice admin. */
const TOMBOL =
  'inline-flex items-center justify-center min-h-11 sm:min-h-0 px-4 sm:px-3 sm:py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0'

function IkonUnduh() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function IkonDetail() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

/**
 * Daftar tagihan murid, dipakai halaman detail siswa admin DAN beranda anak di
 * portal keluarga — pasangan dari `JadwalTable`.
 *
 * Berbentuk kartu, bukan tabel, mengikuti halaman invoice
 * (`components/admin/invoices/StudentClassInvoiceTable`): nomor invoice besar
 * di kiri dengan lencana status, nominal di kanan, lalu isinya terbuka ke bawah
 * berisi bilah kemajuan dan riwayat pembayaran. Kedua blok isi itu memang
 * komponen yang sama persis — lihat `components/invoices/PembayaranBlok.tsx`.
 *
 * Sebelumnya kedua halaman menulis tabelnya masing-masing, dan keduanya
 * menyimpang: kolom pertama "Deskripsi" vs "Nomor", kolom tanggal terbit hanya
 * ada di admin, dan status terlambat cuma dihitung di sisi admin (lihat
 * lib/tagihan.ts). Orang tua dan admin yang saling menelepon sambil membaca
 * angka tagihan yang sama harus membaca kata yang sama juga.
 *
 * Alat kerja admin — catat pembayaran, kirim pengingat, edit, hapus — sengaja
 * TIDAK ikut ke sini; semuanya tinggal di halaman invoice, dan tiap kartu
 * menautkannya lewat "Detail". Menyalinnya berarti dua tempat yang harus
 * sama-sama diingat saat aturan tagihan berubah.
 */

export type PembayaranRow = Pembayaran & { invoice_id: string }

export type TagihanRow = {
  id: string
  invoice_number: string | null
  total_due: number
  status: string
  due_date: string | null
  issued_at: string | null
  /** Nama kelas yang ditagih — label di bawah nomor invoice. */
  classes?: { name: string } | null
  /** Hanya dipakai admin, sebagai cadangan kalau nomornya belum terbit. */
  notes?: string | null
}

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function KartuTagihan({
  invoice,
  pembayaran,
  hariIni,
  untuk,
}: {
  invoice: TagihanRow
  pembayaran: PembayaranRow[]
  hariIni: string
  untuk: 'admin' | 'keluarga'
}) {
  const [terbuka, setTerbuka] = useState(false)
  const st = statusTagihan(invoice.status, invoice.due_date, hariIni)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Di ponsel semuanya menumpuk: nomor, kelas, dan nominal berdiri
          sendiri-sendiri, lalu aksinya jadi satu baris di bawah. Disandingkan
          sebaris seperti di layar lebar, keenam benda ini menuntut ~396px
          padahal isi kartu cuma punya ~303px di layar 375px — nominalnya
          terpotong dan tombolnya berdesakan jadi sasaran sentuh sempit. */}
      <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
        <div className="min-w-0">
          {/* Di portal keluarga lencananya berdiri di ATAS nomor invoice.
              Nomornya panjang dan bertipe mono; disandingkan sebaris, lencana
              terdorong jauh ke kanan atau membungkus, dan status — hal pertama
              yang dicari orang tua — jadi yang paling sulit ditemukan. Admin
              memindai banyak kartu sekaligus, jadi di sana barisnya tetap rapat
              seperti kartu di halaman invoice. */}
          {untuk === 'keluarga' && (
            <span className={`inline-flex whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-lg mb-1.5 ${st.cls}`}>
              {st.label}
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 font-mono truncate">
              {invoice.invoice_number ?? invoice.notes ?? '—'}
            </span>
            {untuk === 'admin' && (
              <span className={`inline-flex whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 ${st.cls}`}>
                {st.label}
              </span>
            )}
          </div>
          {/* Nama kelas sebagai label nomor invoice, sama dengan kartu di
              halaman invoice admin. Tanggal terbit dan jatuh tempo tidak
              ditampilkan di sini maupun di panelnya — yang dicari saat membaca
              daftar ini adalah kelas, status, dan angkanya. Tanggal lengkapnya
              ada di PDF invoice, sejauh satu ketukan lewat "Lihat". */}
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {invoice.classes?.name ? stripClassUniqueTag(invoice.classes.name) : 'Tanpa kelas'}
          </p>
        </div>
        <span className="hidden sm:block flex-1" />
        <span className="text-lg sm:text-sm font-semibold text-gray-900 sm:text-gray-700 shrink-0 tabular-nums">
          {rupiah(Number(invoice.total_due))}
        </span>
        <div className="flex items-center gap-2 sm:contents">
        {/* "Lihat" membuka, titik tiga mengunduh — pasangan yang sama dengan
            halaman invoice admin. */}
        <a
          href={`/api/invoices/${invoice.id}/pdf?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className={TOMBOL}
        >
          Lihat
        </a>
        <MenuTitikTiga label="Aksi tagihan">
          {tutup => (
            <>
              <ItemMenu
                href={`/api/invoices/${invoice.id}/pdf`}
                onClick={tutup}
                ikon={<IkonUnduh />}
              >
                Unduh PDF
              </ItemMenu>
              {untuk === 'admin' && (
                <>
                  <div className="border-t border-slate-100 my-0.5" />
                  <ItemMenu
                    href={`/admin/invoices/${invoice.id}`}
                    onClick={tutup}
                    ikon={<IkonDetail />}
                  >
                    Buka Invoice
                  </ItemMenu>
                </>
              )}
            </>
          )}
        </MenuTitikTiga>
        <button
          type="button"
          onClick={() => setTerbuka(v => !v)}
          aria-expanded={terbuka}
          aria-label={terbuka ? 'Tutup rincian' : 'Lihat rincian pembayaran'}
          className="w-11 h-11 sm:w-7 sm:h-7 flex items-center justify-center text-gray-400 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform ${terbuka ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        </div>
      </div>

      {terbuka && (
        <div className="border-t border-slate-100 px-4 sm:px-5 py-4 space-y-4">
          <KemajuanBayar
            totalDue={invoice.total_due}
            pembayaran={pembayaran}
            warnaBilah={warnaBilahTagihan(invoice.status, invoice.due_date, hariIni)}
          />
          <RiwayatPembayaran
            pembayaran={pembayaran}
            aksi={p => (
              <>
                <a
                  href={`/api/invoices/${invoice.id}/kuitansi/${p.id}/pdf?preview=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={TOMBOL}
                >
                  Lihat
                </a>
                <MenuTitikTiga label="Aksi pembayaran">
                  {tutup => (
                    <ItemMenu
                      href={`/api/invoices/${invoice.id}/kuitansi/${p.id}/pdf`}
                      onClick={tutup}
                      ikon={<IkonUnduh />}
                    >
                      Unduh Kuitansi
                    </ItemMenu>
                  )}
                </MenuTitikTiga>
              </>
            )}
          />
        </div>
      )}
    </div>
  )
}

export default function TagihanList({
  tagihan,
  pembayaran,
  hariIni,
  untuk,
}: {
  tagihan: TagihanRow[]
  pembayaran: PembayaranRow[]
  /** Tanggal hari ini `YYYY-MM-DD`, disiapkan pemanggil di server. */
  hariIni: string
  /** Siapa yang melihat — menentukan letak lencana dan isi menu titik tiga. */
  untuk: 'admin' | 'keluarga'
}) {
  if (tagihan.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">Belum ada tagihan.</p>
  }

  const perInvoice = new Map<string, PembayaranRow[]>()
  for (const p of pembayaran) {
    const daftar = perInvoice.get(p.invoice_id) ?? []
    daftar.push(p)
    perInvoice.set(p.invoice_id, daftar)
  }

  return (
    <div className="space-y-3">
      {tagihan.map(inv => (
        <KartuTagihan
          key={inv.id}
          invoice={inv}
          pembayaran={perInvoice.get(inv.id) ?? []}
          hariIni={hariIni}
          untuk={untuk}
        />
      ))}
    </div>
  )
}
