import AjakWhatsapp from '@/components/keluarga/AjakWhatsapp'
import TombolSalinKode from '@/components/keluarga/TombolSalinKode'

/**
 * Kartu kode referal di halaman Profil — tempat kode ini sebenarnya dicari.
 *
 * Banner di dasar beranda cuma menawarkan; yang sudah tertarik kembali lagi
 * nanti untuk membaca kodenya, dan mereka akan mencarinya di "Profil" karena di
 * sanalah hal-hal tentang akun sendiri berada. Karena itu penjelasan lengkapnya
 * tinggal di sini, bukan di banner: siapa yang dapat vouchernya dan kapan.
 *
 * Bedanya dengan banner: kodenya tampil sebagai teks yang bisa dibaca, bukan
 * cuma disalin. Yang membuka halaman ini sudah berniat mengajak, dan sebagian
 * dari mereka menyebutkan kodenya langsung saat mengobrol — yang tidak terlihat
 * tidak bisa disebutkan.
 */
export default function KartuReferal({ kode }: { kode: string }) {
  return (
    <div className="rounded-xl bg-white shadow ring-1 ring-gray-900/5 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-gray-900">Kode referal Anda</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-base font-semibold tracking-wider text-gray-900 ring-1 ring-slate-200">
          {kode}
        </span>
        <TombolSalinKode
          kode={kode}
          className="text-blue-600 hover:bg-blue-50 active:bg-blue-100"
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        Setiap teman yang berhasil mendaftar dengan kode ini membuat Anda dan dia sama-sama
        mendapat bonus voucher Rp50.000.
      </p>

      <div className="mt-3">
        <AjakWhatsapp kode={kode} className="bg-emerald-600 active:bg-emerald-700" />
      </div>
    </div>
  )
}
