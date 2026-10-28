import type { ReactNode } from 'react'

/**
 * Dua blok isi kartu invoice — bilah kemajuan dan riwayat pembayaran — dipakai
 * bersama oleh halaman invoice admin (`StudentClassInvoiceTable`) dan tab
 * Tagihan di halaman detail siswa serta portal keluarga (`TagihanList`).
 *
 * Diangkat ke sini setelah tab Tagihan menumbuhkan salinannya sendiri. Dua
 * gambaran "sudah bayar berapa" yang dirakit terpisah adalah persis jenis
 * kembaran yang sepanjang berkas-berkas ini terbukti melenceng: cukup satu
 * pihak memperbaiki pembulatan persen atau urutan tahap, dan admin serta orang
 * tua kembali membaca angka yang berbeda untuk tagihan yang sama.
 *
 * Yang TIDAK ikut ke sini adalah aksinya — kirim kuitansi, edit, hapus, catat
 * pembayaran. Itu memang berbeda antara admin dan keluarga, jadi tiap pemanggil
 * menyuntikkannya lewat `aksi`.
 */

export type Pembayaran = {
  id: string
  amount: number
  paid_at: string
}

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
  })
}

/**
 * Urut menaik menurut tanggal bayar — penomoran "Tahap" harus mengikuti urutan
 * pembayaran yang sebenarnya. `created_at` dulu jadi pemecah seri di halaman
 * invoice; di sini seri dipecah dengan `id` supaya pemanggil tidak wajib ikut
 * mengambil kolom itu, dan hasilnya tetap tetap (stabil) antar render.
 */
export function urutkanPembayaran<T extends Pembayaran>(daftar: T[]): T[] {
  return [...daftar].sort(
    (a, b) => a.paid_at.localeCompare(b.paid_at) || a.id.localeCompare(b.id),
  )
}

export function hitungPembayaran(totalDue: number, daftar: Pembayaran[]) {
  const dibayar = daftar.reduce((s, p) => s + Number(p.amount), 0)
  const total = Number(totalDue)
  return {
    dibayar,
    kurang: Math.max(0, total - dibayar),
    persen: total > 0 ? Math.min(100, Math.round((dibayar / total) * 100)) : 0,
  }
}

export function KemajuanBayar({
  totalDue,
  pembayaran,
}: {
  totalDue: number
  pembayaran: Pembayaran[]
}) {
  const { dibayar, kurang, persen } = hitungPembayaran(totalDue, pembayaran)
  return (
    <div>
      {/* Dua angka berlabel: yang sudah masuk dan yang masih harus dibayar.
          Total tagihan tidak diulang — nominalnya sudah ada di kepala kartu.
          Bilahnya hanya gambar dari kedua angka itu, dengan warna yang sama
          (hijau = sudah dibayar, merah muda = sisa); dulu warnanya mengikuti
          status invoice, jadi kuning di samping angka hijau dan merah tanpa
          ada yang menjelaskan apa hubungannya. Invoice lunas menulis "Lunas"
          di kolom kedua, bukan "Rp 0" yang terbaca seperti tunggakan. */}
      <dl className="grid grid-cols-2 gap-3 mb-2.5">
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">Sudah dibayar</dt>
          <dd className="text-sm font-semibold text-green-600 tabular-nums">{rupiah(dibayar)}</dd>
        </div>
        <div className="min-w-0 text-right">
          <dt className="text-xs text-gray-400">Belum dibayar</dt>
          <dd
            className={`text-sm font-semibold tabular-nums ${kurang > 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {kurang > 0 ? rupiah(kurang) : 'Lunas'}
          </dd>
        </div>
      </dl>
      <div
        className={`w-full h-1.5 rounded-full overflow-hidden ${kurang > 0 ? 'bg-red-200' : 'bg-green-500'}`}
        role="img"
        aria-label={`${persen}% sudah dibayar`}
      >
        <div className="h-full bg-green-500 transition-all" style={{ width: `${persen}%` }} />
      </div>
    </div>
  )
}

export function RiwayatPembayaran<T extends Pembayaran>({
  pembayaran,
  aksi,
  bawahBaris,
  kosong = 'Belum ada pembayaran tercatat.',
  garisPenuh = false,
}: {
  pembayaran: T[]
  /** Tombol/tautan di ujung tiap baris. `tahap` untuk penamaan kuitansi. */
  aksi?: (p: T, tahap: number) => ReactNode
  /** Isi tambahan di bawah baris — halaman invoice memakainya untuk formulir
   *  sunting pembayaran yang terbuka di tempat. */
  bawahBaris?: (p: T, tahap: number) => ReactNode
  kosong?: string
  /** Garis pemisah antar baris menjangkau tepi kartu pembungkusnya (yang
   *  berpadding `px-4 sm:px-5`), bukan berhenti di batas isi. */
  garisPenuh?: boolean
}) {
  const urut = urutkanPembayaran(pembayaran)

  if (urut.length === 0) {
    return <p className="text-sm text-gray-400">{kosong}</p>
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Riwayat Pembayaran
      </p>
      <div className="divide-y divide-slate-200">
        {/* Terbaru di atas, tapi nomor tahapnya tetap dari urutan aslinya. */}
        {[...urut].reverse().map((p, i) => {
          const tahap = urut.length - i
          return (
            <div
              key={p.id}
              className={`space-y-2 py-2.5 first:pt-0 last:pb-0 ${garisPenuh ? '-mx-4 sm:-mx-5 px-4 sm:px-5' : ''}`}
            >
              {/* Di ponsel barisnya pecah dua: keterangan di atas, nominal dan
                  aksinya di bawah. Sebaris seperti di layar lebar, keenam benda
                  ini menuntut ~368px sementara panel hanya punya ~303px di
                  layar 375px. */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 inline-block rounded-full ${tahap === urut.length ? 'animate-pulse bg-gray-500' : 'bg-gray-300'}`}
                    style={{ width: '8px', height: '8px' }}
                  />
                  <span className="text-[14px] text-gray-700">Tahap {tahap}</span>
                  <span className="text-xs text-gray-400">{tanggal(p.paid_at)}</span>
                </div>
                <span className="hidden sm:block flex-1" />
                <div className="flex items-center gap-2 pl-4 sm:pl-0 sm:contents">
                  <span className="text-sm font-medium text-gray-800 shrink-0 tabular-nums">
                    {rupiah(Number(p.amount))}
                  </span>
                  <span className="flex-1 sm:hidden" />
                  {aksi?.(p, tahap)}
                </div>
              </div>
              {bawahBaris?.(p, tahap)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
