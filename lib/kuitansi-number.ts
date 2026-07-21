import { createAdminClient } from '@/lib/supabase/server-admin'

// Kuitansi numbers are their own monthly sequence — NOT derived from the
// source invoice's number — because two different invoices (e.g. two
// students in the same group class) can each have their own "tahap 1"
// payment in the same month, which would otherwise produce identical
// kuitansi numbers if the invoice's sequence digit were simply replaced.
export async function getKuitansiNumber(
  admin: ReturnType<typeof createAdminClient>,
  paymentId: string,
  paymentCreatedAt: string
): Promise<string> {
  const created = new Date(paymentCreatedAt)
  const year = created.getFullYear()
  const month = created.getMonth() + 1

  const startOfMonth = new Date(year, month - 1, 1).toISOString()
  const startOfNextMonth = new Date(year, month, 1).toISOString()

  const { data: monthPayments } = await admin
    .from('invoice_payments')
    .select('id')
    .gte('created_at', startOfMonth)
    .lt('created_at', startOfNextMonth)
    .order('created_at', { ascending: true })

  const seq = ((monthPayments ?? []).findIndex(p => p.id === paymentId) + 1) || 1
  const seqStr = String(seq).padStart(2, '0')
  const monthStr = String(month).padStart(2, '0')

  return `${seqStr} / ${monthStr} / KUITANSI / TLC / ${year}`
}
