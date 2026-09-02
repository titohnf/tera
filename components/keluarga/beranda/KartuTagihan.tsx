import Link from 'next/link'
import type { RingkasanTagihan } from '@/lib/keluarga-anak'

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Kartu sisa tagihan — muncul hanya bila `ringkasanTagihan` mengizinkan.
 *
 * Bentuknya sengaja sama dengan kartu "Lanjutkan latihan" di bawahnya: ikon
 * berpetak warna di kiri, dua baris teks di tengah, panah di kanan. Keduanya
 * kartu tindakan, dan kartu yang berperan sama sepatutnya berbentuk sama —
 * itu yang membuat sebuah halaman terbaca sebagai satu susunan, bukan sebagai
 * tumpukan kotak yang kebetulan bertetangga.
 *
 * Warnanya kuning, bukan merah, selama tagihannya cuma belum lunas. Invoice
 * kelas reguler terbit satu semester sekaligus sementara orang tua membayarnya
 * bulanan, jadi belum lunas adalah keadaan yang WAJAR — merah untuk keadaan
 * wajar adalah cara tercepat membuat orang berhenti mempercayai warna merah.
 * Yang benar-benar terlambat tetap merah.
 */
export default function KartuTagihan({
  studentId,
  tagihan,
}: {
  studentId: string
  tagihan: RingkasanTagihan
}) {
  const merah = tagihan.terlambat

  return (
    <Link
      href={`/keluarga/${studentId}/tagihan`}
      /* Keadaan terlambat tidak lagi diberi cincin merah: kartu ini tidak
         punya garis tepi sama sekali, dan menambahkannya kembali cuma untuk
         satu keadaan akan membuat kartunya berbentuk lain dari tetangganya.
         Merahnya cukup dibawa ikon dan pilnya. */
      className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu transition active:bg-slate-50"
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          merah ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Tagihan</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
              merah ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {merah ? 'Terlambat' : 'Belum lunas'}
          </span>
        </span>
        <span className="mt-0.5 block text-lg font-bold tabular-nums text-gray-900">
          {rupiah(tagihan.sisa)}
        </span>
      </span>

      <IkonPanah />
    </Link>
  )
}

/** Panah kanan tipis — penanda "ini bisa diketuk", dipakai kartu-kartu beranda. */
export function IkonPanah() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
