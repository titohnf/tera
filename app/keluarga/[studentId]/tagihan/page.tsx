import { anakOrRedirect } from '@/lib/keluarga'
import { createClient } from '@/lib/supabase/server'
import { todayWib } from '@/lib/daily-message'
import TagihanList, { type TagihanRow, type PembayaranRow } from '@/components/siswa/TagihanList'

/**
 * Tagihan seorang anak — daftar yang sama persis dengan yang dibuka admin,
 * dirender oleh komponen yang sama (`components/siswa/TagihanList`).
 *
 * Invoice draft tidak ikut: angkanya belum diterbitkan ke keluarga dan masih
 * bisa berubah.
 *
 * Keterlambatan dihitung terhadap hari WIB yang sama dengan halaman admin
 * (`todayWib`), supaya keduanya tidak berbeda sehari di pagi buta — selisih
 * seperti itu berujung telepon yang tidak perlu.
 */
export default async function TagihanAnak({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  const supabase = await createClient()

  const { data: invoiceRows } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_due, status, due_date, issued_at, classes(name)')
    .eq('student_id', studentId)
    .neq('status', 'draft')
    .order('issued_at', { ascending: false })
  const invoices = invoiceRows ?? []

  // Keluarga memang berhak membaca pembayarannya sendiri — kebijakan "Families
  // read own payments" di migrasi 076 — jadi kueri ini lewat klien ber-RLS
  // seperti yang lain.
  const { data: pembayaranRows } = invoices.length
    ? await supabase
        .from('invoice_payments')
        .select('id, invoice_id, amount, paid_at')
        .in('invoice_id', invoices.map((i) => i.id as string))
    : { data: null }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Tagihan</h1>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4 sm:p-5">
        <TagihanList
          tagihan={invoices as unknown as TagihanRow[]}
          pembayaran={(pembayaranRows ?? []) as unknown as PembayaranRow[]}
          hariIni={todayWib()}
          untuk="keluarga"
        />
      </div>
    </div>
  )
}
