import Link from 'next/link'
import { redirect } from 'next/navigation'
import HasilPeserta, { type HasilTryOut } from '@/components/tryout/HasilPeserta'

/**
 * Hasil SATU try out di Tera, untuk orang yang sudah masuk (kode atau akun):
 * tanpa kode atau login lagi. Tiga keadaan: hasil dibuka (tampil lengkap),
 * sudah dikerjakan tapi belum dibuka admin, dan belum mengerjakan (kembali ke
 * daftar).
 */
export default function HalamanHasil({
  hasil,
  quizId,
  nama,
  ctaHref,
  kode,
  kembaliHref,
}: {
  hasil: HasilTryOut | null
  quizId: string
  nama: string
  ctaHref: string
  kode?: string
  kembaliHref: string
}) {
  const paket = hasil?.paket.find((p) => p.quiz_id === quizId)
  const menunggu = hasil?.menunggu.find((m) => m.quiz_id === quizId)
  if (!paket && !menunggu) redirect(kembaliHref)

  return (
    <div className="space-y-5">
      <Link href={kembaliHref} className="text-sm text-gray-500 underline">← Kembali ke Try Out</Link>
      {paket ? (
        <HasilPeserta p={paket} nama={hasil?.nama ?? nama} ctaHref={ctaHref} kode={kode} />
      ) : (
        <div className="rounded-xl bg-white p-6 text-center shadow ring-1 ring-gray-900/5">
          <h1 className="text-base font-semibold text-gray-900">{menunggu?.judul}</h1>
          <p className="mt-2 text-sm font-medium text-emerald-700">Kamu sudah mengerjakan try out ini.</p>
          <p className="mt-2 text-sm text-gray-600">
            Hasilnya dibuka setelah semua sesi try out selesai. Buka halaman ini lagi nanti.
          </p>
        </div>
      )}
    </div>
  )
}
