import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect } from '@/lib/keluarga'

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const statusLabel: Record<string, { teks: string; kelas: string }> = {
  draft: { teks: 'Draf', kelas: 'bg-gray-100 text-gray-600' },
  sent: { teks: 'Belum dibayar', kelas: 'bg-yellow-100 text-yellow-700' },
  paid: { teks: 'Lunas', kelas: 'bg-green-100 text-green-700' },
}

export default async function TagihanPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const supabase = await createClient()

  // Invoice berstatus draft belum diterbitkan ke keluarga, jadi tidak
  // ditampilkan — angkanya masih bisa berubah di tangan admin.
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_due, status, due_date, issued_at')
    .eq('student_id', studentId)
    .neq('status', 'draft')
    .order('issued_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/keluarga/${studentId}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← {anak.full_name}
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-1">Tagihan</h1>
      </div>

      {(invoices ?? []).length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          Belum ada tagihan.
        </p>
      ) : (
        <ul className="rounded-xl bg-white shadow ring-1 ring-gray-900/5 divide-y divide-gray-100">
          {(invoices ?? []).map((i) => {
            const s = statusLabel[i.status] ?? { teks: i.status, kelas: 'bg-gray-100 text-gray-600' }
            return (
              <li key={i.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{i.invoice_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Terbit {new Date(i.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {i.due_date ? ` · jatuh tempo ${new Date(i.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums text-gray-900">{rupiah(Number(i.total_due))}</p>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.kelas}`}>{s.teks}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
