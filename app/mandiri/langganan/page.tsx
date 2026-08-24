import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { mandiriContext } from '@/lib/mandiri'

/**
 * Status langganan dan cara mengaktifkannya.
 *
 * Halaman ini adalah tempat mendarat dua keadaan sekaligus: akun yang baru
 * mendaftar dan belum membayar, dan akun yang langganannya sudah habis.
 * Keduanya butuh jawaban yang sama — berapa, ke mana, lalu apa — jadi keduanya
 * dibawa ke sini alih-alih ke layar penolakan.
 *
 * Pembayaran masih manual: transfer, lalu admin yang mengaktifkan dari
 * `/admin/subscriptions`. Karena itu halaman ini menyebut apa yang harus
 * dilakukan orangnya SESUDAH transfer — tanpa itu, ia menunggu sesuatu yang
 * tidak akan pernah terjadi sendiri.
 *
 * Barisnya dibaca lewat client sesi: policy "Owners read own subscriptions"
 * (migrasi 109) yang membatasinya ke miliknya sendiri, bukan klausa `.eq()` di
 * sini.
 */

const REKENING = process.env.NEXT_PUBLIC_REKENING_LANGGANAN ?? ''
const HARGA = process.env.NEXT_PUBLIC_HARGA_LANGGANAN ?? ''

function tanggal(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

const LABEL: Record<string, { teks: string; cls: string }> = {
  pending: { teks: 'Menunggu aktivasi', cls: 'bg-amber-100 text-amber-700' },
  active: { teks: 'Aktif', cls: 'bg-green-100 text-green-700' },
  stopped: { teks: 'Dihentikan', cls: 'bg-slate-100 text-slate-500' },
  expired: { teks: 'Sudah habis', cls: 'bg-slate-100 text-slate-500' },
}

export default async function LanggananMandiri() {
  const { produk } = await mandiriContext()
  const supabase = await createClient()

  const { data: baris } = await supabase
    .from('subscriptions')
    .select('id, product, status, starts_at, ends_at, amount, note, created_at')
    .order('created_at', { ascending: false })

  const riwayat = baris ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Langganan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {produk.sora ? 'SORA sudah aktif untuk akunmu.' : 'SORA belum aktif untuk akunmu.'}
        </p>
      </div>

      {!produk.sora && (
        <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Cara mengaktifkan</p>
          <ol className="space-y-2 text-sm text-gray-600 leading-relaxed list-decimal pl-4">
            <li>
              Transfer{' '}
              {HARGA ? (
                <span className="font-semibold text-gray-900">{HARGA}</span>
              ) : (
                'biaya langganan'
              )}{' '}
              ke rekening{' '}
              {REKENING ? (
                <span className="font-semibold text-gray-900">{REKENING}</span>
              ) : (
                'bimbel'
              )}
              .
            </li>
            <li>Kirim bukti transfernya ke admin lewat WhatsApp.</li>
            <li>
              Admin mengaktifkan langgananmu, biasanya di hari yang sama. Halaman ini akan berubah
              sendiri begitu aktif.
            </li>
          </ol>
          {!REKENING && (
            /* Nomor rekening belum disetel di env. Kalimatnya tetap jujur alih-alih
               menampilkan tempat kosong yang terbaca seperti kesalahan muat. */
            <p className="text-xs text-gray-400">
              Nomor rekeningnya belum tercantum di sini — tanyakan ke admin.
            </p>
          )}
        </div>
      )}

      {riwayat.length > 0 && (
        <div className="rounded-xl bg-white shadow ring-1 ring-gray-900/5 divide-y divide-slate-100 overflow-hidden">
          {riwayat.map((s) => {
            const label = LABEL[s.status as string] ?? {
              teks: s.status as string,
              cls: 'bg-slate-100 text-slate-500',
            }
            return (
              <div key={s.id as string} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 uppercase">
                    {s.product as string}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tanggal(s.starts_at as string | null)} – {tanggal(s.ends_at as string | null)}
                  </p>
                </div>
                <span
                  className={`inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${label.cls}`}
                >
                  {label.teks}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Link
        href="/mandiri"
        className="block text-center text-sm font-medium text-blue-600 py-2"
      >
        Kembali ke beranda
      </Link>
    </div>
  )
}
