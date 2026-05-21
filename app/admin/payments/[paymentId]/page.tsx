import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MarkPaidForm from '@/components/admin/payments/MarkPaidForm'
import { cancelPayment } from '@/lib/actions/admin/payments'

export default async function PaymentDetailPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('session_payments')
    .select('*, sessions(id, scheduled_at, duration_minutes, topic, location, classes(name, level)), profiles!tutor_id(full_name, email, phone)')
    .eq('id', paymentId)
    .single() as unknown as {
      data: {
        id: string; base_amount: number; bonus_amount: number; total_amount: number
        status: string; paid_at: string | null; payment_reference: string | null; notes: string | null
        created_at: string; updated_at: string
        sessions: {
          id: string; scheduled_at: string; duration_minutes: number
          topic: string | null; location: string | null
          classes: { name: string; level: string | null } | null
        } | null
        profiles: { full_name: string; email: string; phone: string | null } | null
      } | null
    }

  if (!payment) notFound()

  const sessionDate = payment.sessions?.scheduled_at ? new Date(payment.sessions.scheduled_at) : null

  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Belum Dibayar',
    paid: 'Sudah Dibayar',
    cancelled: 'Dibatalkan',
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/payments" className="hover:text-blue-600">Keuangan</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Detail Pembayaran</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-5">
          {/* Payment summary */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-900">Detail Pembayaran</h1>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLOR[payment.status] ?? 'bg-gray-100'}`}>
                {STATUS_LABEL[payment.status] ?? payment.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tutor</span>
                <span className="font-medium">{payment.profiles?.full_name ?? '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kelas</span>
                <span className="font-medium">
                  {payment.sessions?.classes?.name ?? '-'}
                  {payment.sessions?.classes?.level ? ` (${payment.sessions.classes.level})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tanggal Sesi</span>
                <span className="font-medium">
                  {sessionDate?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? '-'}
                </span>
              </div>
              {payment.sessions?.topic && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Topik</span>
                  <span>{payment.sessions.topic}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Gaji Pokok</span>
                <span>{formatRp(payment.base_amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Bonus</span>
                <span className={payment.bonus_amount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {payment.bonus_amount > 0 ? `+${formatRp(payment.bonus_amount)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 font-semibold text-base">
                <span>Total Dibayarkan</span>
                <span className="text-blue-600">{formatRp(payment.total_amount)}</span>
              </div>
            </div>

            {payment.status === 'paid' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl text-sm">
                <p className="font-medium text-green-700 mb-1">Pembayaran terkonfirmasi</p>
                <p className="text-green-600">
                  Dibayar: {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
                {payment.payment_reference && (
                  <p className="text-green-600">Referensi: {payment.payment_reference}</p>
                )}
                {payment.notes && <p className="text-green-600">Catatan: {payment.notes}</p>}
              </div>
            )}
          </div>

          {/* Actions */}
          {payment.status === 'pending' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Konfirmasi Pembayaran</h2>
              <MarkPaidForm paymentId={paymentId} />
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Info Tutor</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{payment.profiles?.full_name}</p>
              <p className="text-gray-500">{payment.profiles?.email}</p>
              {payment.profiles?.phone && <p className="text-gray-500">{payment.profiles.phone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Navigasi</h3>
            <div className="space-y-2">
              {payment.sessions?.id && (
                <Link
                  href={`/admin/sessions/${payment.sessions.id}`}
                  className="block text-sm text-blue-600 hover:underline"
                >
                  → Lihat detail sesi
                </Link>
              )}
              <Link href="/admin/payments" className="block text-sm text-gray-500 hover:text-gray-700">
                ← Kembali ke daftar
              </Link>
            </div>
          </div>

          {payment.status === 'pending' && (
            <form action={async () => {
              'use server'
              await cancelPayment(paymentId)
            }}>
              <button
                type="submit"
                className="w-full px-4 py-2.5 border border-red-200 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                Batalkan Pembayaran
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
