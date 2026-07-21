'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function monthsBetween(startStr: string, endStr: string): number {
  const s = new Date(startStr)
  const e = new Date(endStr)
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1)
}

function firstOfCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// month is "YYYY-MM". Returns [firstOfMonth, firstOfNextMonth) as date strings.
function monthRange(month: string): [string, string] {
  const [year, mon] = month.split('-').map(Number)
  const start = `${month}-01`
  const end = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`
  return [start, end]
}

async function countSessionsForClass(
  admin: ReturnType<typeof createAdminClient>,
  classId: string,
  period?: string
): Promise<number> {
  let query = admin
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .neq('status', 'cancelled')

  if (period) {
    const [start, end] = monthRange(period)
    query = query.gte('scheduled_at', start).lt('scheduled_at', end)
  }

  const { count } = await query
  return count ?? 0
}

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

const LineItemSchema = z.object({
  description: z.string().min(1),
  months: z.number().min(0),
  amount: z.number().min(0),
  is_deduction: z.boolean(),
  unit: z.enum(['bulan', 'pertemuan']).optional(),
  show_qty: z.boolean().optional(),
  // "YYYY-MM" — set on monthly-billed private-class invoices so the pertemuan
  // count is scoped to that month instead of the whole class enrollment.
  period: z.string().optional(),
})

const InvoiceSchema = z.object({
  invoice_number: z.string().optional(),
  class_id: z.string().uuid().nullable().optional(),
  student_id: z.string().uuid().nullable().optional(),
  student_name: z.string().min(1),
  parent_name: z.string().min(1),
  line_items: z.array(LineItemSchema),
  total_due: z.number(),
  payment_method: z.string().min(1),
  bank_account: z.string().min(1),
  due_date: z.string().nullable().optional(),
  issued_at: z.string(),
  status: z.enum(['draft', 'sent', 'paid']).optional(),
  notes: z.string().nullable().optional(),
})

async function generateInvoiceNumber(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const startOfMonth = new Date(year, month - 1, 1).toISOString()
  const startOfNextMonth = new Date(year, month, 1).toISOString()

  const { count } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)
    .lt('created_at', startOfNextMonth)

  const seq = (count ?? 0) + 1
  const seqStr = String(seq).padStart(2, '0')
  const monthStr = String(month).padStart(2, '0')

  return `${seqStr} / ${monthStr} / INVOICE / TLC / ${year}`
}

export async function createInvoice(data: unknown) {
  const parsed = InvoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }

  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const invoiceNumber = parsed.data.invoice_number?.trim()
    ? parsed.data.invoice_number.trim()
    : await generateInvoiceNumber(ctx.admin)

  const { data: inserted, error } = await ctx.admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      class_id: parsed.data.class_id ?? null,
      student_id: parsed.data.student_id ?? null,
      student_name: parsed.data.student_name,
      parent_name: parsed.data.parent_name,
      line_items: parsed.data.line_items,
      total_due: parsed.data.total_due,
      payment_method: parsed.data.payment_method,
      bank_account: parsed.data.bank_account,
      due_date: parsed.data.due_date ?? null,
      issued_at: parsed.data.issued_at,
      status: parsed.data.status ?? 'draft',
      notes: parsed.data.notes ?? null,
      created_by: ctx.user.id,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/invoices')
  return { id: inserted.id }
}

export async function updateInvoice(id: string, data: unknown) {
  const parsed = InvoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }

  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('invoices')
    .update({
      invoice_number: parsed.data.invoice_number,
      class_id: parsed.data.class_id ?? null,
      student_id: parsed.data.student_id ?? null,
      student_name: parsed.data.student_name,
      parent_name: parsed.data.parent_name,
      line_items: parsed.data.line_items,
      total_due: parsed.data.total_due,
      payment_method: parsed.data.payment_method,
      bank_account: parsed.data.bank_account,
      due_date: parsed.data.due_date ?? null,
      issued_at: parsed.data.issued_at,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${id}`)
  return { success: true }
}

export async function updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'partially_paid' | 'paid') {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${id}`)
  return { success: true }
}

export async function updatePayment(paymentId: string, amount: number, paidAt: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: payment } = await ctx.admin
    .from('invoice_payments')
    .select('invoice_id')
    .eq('id', paymentId)
    .single() as { data: { invoice_id: string } | null }

  if (!payment) return { error: 'Pembayaran tidak ditemukan' }

  const invoiceId = payment.invoice_id

  const { error } = await ctx.admin
    .from('invoice_payments')
    .update({ amount, paid_at: paidAt })
    .eq('id', paymentId)

  if (error) return { error: error.message }

  const [{ data: invoice }, { data: allPayments }] = await Promise.all([
    ctx.admin.from('invoices').select('total_due').eq('id', invoiceId).single() as unknown as Promise<{ data: { total_due: number } | null }>,
    ctx.admin.from('invoice_payments').select('amount').eq('invoice_id', invoiceId) as unknown as Promise<{ data: { amount: number }[] | null }>,
  ])

  const totalPaid = (allPayments ?? []).reduce((s, p) => s + p.amount, 0)
  const newStatus = totalPaid <= 0 ? 'sent' : totalPaid >= (invoice?.total_due ?? 0) ? 'paid' : 'partially_paid'

  await ctx.admin
    .from('invoices')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  await syncNextInvoice(invoiceId, ctx.admin)

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${invoiceId}`)
  return { success: true }
}

export async function deletePayment(paymentId: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: payment } = await ctx.admin
    .from('invoice_payments')
    .select('invoice_id, amount')
    .eq('id', paymentId)
    .single() as { data: { invoice_id: string; amount: number } | null }

  if (!payment) return { error: 'Pembayaran tidak ditemukan' }

  const invoiceId = payment.invoice_id

  const { error } = await ctx.admin.from('invoice_payments').delete().eq('id', paymentId)
  if (error) return { error: error.message }

  const [{ data: invoice }, { data: remaining }] = await Promise.all([
    ctx.admin.from('invoices').select('total_due').eq('id', invoiceId).single() as unknown as Promise<{ data: { total_due: number } | null }>,
    ctx.admin.from('invoice_payments').select('amount').eq('invoice_id', invoiceId) as unknown as Promise<{ data: { amount: number }[] | null }>,
  ])

  const totalPaid = (remaining ?? []).reduce((s, p) => s + p.amount, 0)
  const newStatus = totalPaid <= 0 ? 'sent' : totalPaid >= (invoice?.total_due ?? 0) ? 'paid' : 'partially_paid'

  await ctx.admin
    .from('invoices')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  await syncNextInvoice(invoiceId, ctx.admin)

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${invoiceId}`)
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin.from('invoices').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/invoices')
  return { success: true }
}

export async function generateFirstInvoice(studentId: string, classId: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: draftCheck } = await ctx.admin
    .from('invoices')
    .select('id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('status', 'draft')
    .limit(1)
    .maybeSingle()
  if (draftCheck) return { error: 'Masih ada invoice draft yang belum dikirim. Kirim atau hapus dulu sebelum membuat invoice baru.' }

  const [{ data: student }, { data: cls }] = await Promise.all([
    ctx.admin.from('profiles').select('full_name, parent_name').eq('id', studentId).single(),
    ctx.admin.from('classes').select('name, level, class_type, jenis, start_date, end_date').eq('id', classId).single(),
  ])

  if (!student) return { error: 'Siswa tidak ditemukan' }
  if (!cls) return { error: 'Kelas tidak ditemukan' }
  if ((cls as any).class_type === 'yayasan') return { error: 'Kelas yayasan tidak memerlukan invoice' }

  const billingJenis = (cls as any).jenis === 'reguler' ? 'Reguler' : (cls as any).jenis === 'fokus' ? 'Fokus' : null

  const { data: rates } = billingJenis ? await ctx.admin
    .from('billing_rates')
    .select('amount, jenis, billing_rate_periods!inner(is_active)')
    .eq('class_type', (cls as any).class_type)
    .eq('jenjang', (cls as any).level)
    .eq('jenis', billingJenis)
    .eq('billing_rate_periods.is_active', true)
    .limit(1) as any : { data: [] as any[] }

  const rate = rates?.[0]
  const amount = rate ? Number(rate.amount) : 0
  const isPrivate = (cls as any).class_type === 'private'
  const typeLabel = isPrivate ? 'Privat' : 'Grup'

  let quantity: number
  let unit: 'bulan' | 'pertemuan'

  if (isPrivate) {
    unit = 'pertemuan'
    const { count } = await ctx.admin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .neq('status', 'cancelled')
    quantity = count ?? 0
    if (quantity === 0) return { error: 'Belum ada sesi terjadwal untuk kelas privat ini' }
  } else {
    unit = 'bulan'
    quantity = (cls as any).start_date && (cls as any).end_date
      ? monthsBetween((cls as any).start_date, (cls as any).end_date)
      : 1
  }

  const description = [typeLabel, (cls as any).level, rate?.jenis].filter(Boolean).join(' ')
  const lineItems = [{ description, months: quantity, amount, is_deduction: false, unit }]
  const totalDue = quantity * amount

  const issuedAt = firstOfCurrentMonth()
  const invoiceNumber = await generateInvoiceNumber(ctx.admin)

  const { data: inserted, error } = await ctx.admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      class_id: classId,
      student_id: studentId,
      student_name: (student as any).full_name,
      parent_name: (student as any).parent_name ?? '',
      line_items: lineItems,
      total_due: totalDue,
      payment_method: 'Transfer Bank',
      bank_account: 'BSI - 7296753275 a.n. Suci Purnama Sari',
      due_date: addDays(issuedAt, 7),
      issued_at: issuedAt,
      status: 'draft',
      created_by: ctx.user.id,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/invoices')
  return { id: inserted.id }
}

// ─── Sync draft invoices after a private class's session count changes ────────

type SyncableLineItem = {
  description: string
  months: number
  amount: number
  is_deduction: boolean
  unit?: 'bulan' | 'pertemuan'
  period?: string
}

const lineSubtotal = (item: { months: number; amount: number }) =>
  item.months === 0 ? item.amount : item.months * item.amount

// Private classes are billed per pertemuan, with the session count baked
// into the invoice's line_items as a plain number at creation time. When
// sessions are added or removed afterward (deleteSession, createSession, or
// a class edit that regenerates sessions), any invoice still in 'draft'
// hasn't been sent to the parent yet, so it's safe to update its pertemuan
// count and total to match — sent/paid invoices are left untouched since
// those have already been communicated or settled.
//
// Line items with a `period` (monthly-billed invoices, see
// generateMonthlyInvoiceForStudent) are re-counted against sessions in just
// that month; items without one are re-counted against the whole class, as
// with the one-off lump-sum invoice from generateFirstInvoice.
export async function syncPrivateClassDraftInvoices(
  classId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  const { data: cls } = await admin.from('classes').select('class_type, level, jenis').eq('id', classId).single()
  if (!cls || cls.class_type !== 'private') return

  const { data: draftInvoices } = await admin
    .from('invoices')
    .select('id, line_items')
    .eq('class_id', classId)
    .eq('status', 'draft') as { data: { id: string; line_items: SyncableLineItem[] }[] | null }

  if (!draftInvoices || draftInvoices.length === 0) return

  const countCache = new Map<string, number>()
  async function liveCountFor(period?: string): Promise<number> {
    const key = period ?? '__whole_class__'
    if (!countCache.has(key)) countCache.set(key, await countSessionsForClass(admin, classId, period))
    return countCache.get(key)!
  }

  // The per-pertemuan rate is also a creation-time snapshot — if jenis was
  // missing/wrong when the invoice was first generated (billing_rates
  // lookup failed, defaulting to 0) and gets corrected afterward, a draft
  // invoice should pick up the fixed rate too, not just the session count.
  const billingJenis = cls.jenis === 'reguler' ? 'Reguler' : cls.jenis === 'fokus' ? 'Fokus' : null
  let currentRate: number | null = null
  if (billingJenis) {
    const { data: rates } = await admin
      .from('billing_rates')
      .select('amount, billing_rate_periods!inner(is_active)')
      .eq('class_type', cls.class_type)
      .eq('jenjang', cls.level)
      .eq('jenis', billingJenis)
      .eq('billing_rate_periods.is_active', true)
      .limit(1) as unknown as { data: { amount: number }[] | null }
    currentRate = rates?.[0] ? Number(rates[0].amount) : null
  }

  for (const inv of draftInvoices) {
    const items = inv.line_items ?? []
    let changed = false
    const updatedItems: SyncableLineItem[] = []
    for (const item of items) {
      if (item.is_deduction || item.unit !== 'pertemuan') {
        updatedItems.push(item)
        continue
      }
      const liveCount = await liveCountFor(item.period)
      const liveAmount = currentRate ?? item.amount
      if (item.months === liveCount && item.amount === liveAmount) {
        updatedItems.push(item)
      } else {
        changed = true
        updatedItems.push({ ...item, months: liveCount, amount: liveAmount })
      }
    }
    if (!changed) continue

    const newTotal = Math.max(0, updatedItems.reduce((sum, item) =>
      item.is_deduction ? sum - lineSubtotal(item) : sum + lineSubtotal(item), 0))

    await admin
      .from('invoices')
      .update({ line_items: updatedItems, total_due: newTotal, updated_at: new Date().toISOString() })
      .eq('id', inv.id)
  }

  revalidatePath('/admin/invoices')
}

export async function generateMonthlyInvoiceForStudent(studentId: string, classId: string, month: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  if (!/^\d{4}-\d{2}$/.test(month)) return { error: 'Bulan tidak valid' }
  const [issuedAt, nextMonthStr] = monthRange(month)

  const { data: existing } = await ctx.admin
    .from('invoices')
    .select('id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .gte('issued_at', issuedAt)
    .lt('issued_at', nextMonthStr)
    .limit(1)
    .maybeSingle()
  if (existing) return { error: 'Invoice untuk bulan ini sudah ada' }

  const [{ data: student }, { data: cls }] = await Promise.all([
    ctx.admin.from('profiles').select('full_name, parent_name').eq('id', studentId).single(),
    ctx.admin.from('classes').select('name, level, class_type, jenis').eq('id', classId).single(),
  ])

  if (!student) return { error: 'Siswa tidak ditemukan' }
  if (!cls) return { error: 'Kelas tidak ditemukan' }
  if ((cls as { class_type: string | null }).class_type !== 'private') {
    return { error: 'Invoice bulanan hanya berlaku untuk kelas privat' }
  }

  const sessionCount = await countSessionsForClass(ctx.admin, classId, month)
  if (sessionCount === 0) return { error: 'Belum ada sesi terjadwal di bulan ini' }

  const clsData = cls as { name: string; level: string | null; class_type: string; jenis: string | null }
  const billingJenis = clsData.jenis === 'reguler' ? 'Reguler' : clsData.jenis === 'fokus' ? 'Fokus' : null

  const { data: rates } = billingJenis ? await ctx.admin
    .from('billing_rates')
    .select('amount, jenis, billing_rate_periods!inner(is_active)')
    .eq('class_type', clsData.class_type)
    .eq('jenjang', clsData.level)
    .eq('jenis', billingJenis)
    .eq('billing_rate_periods.is_active', true)
    .limit(1) as unknown as { data: { amount: number; jenis: string }[] | null } : { data: [] }

  const rate = rates?.[0]
  const amount = rate ? Number(rate.amount) : 0

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const description = `Privat${clsData.level ? ` ${clsData.level}` : ''} — ${monthLabel} (${sessionCount} pertemuan)`
  const lineItems = [{ description, months: sessionCount, amount, is_deduction: false, unit: 'pertemuan' as const, period: month }]
  const totalDue = sessionCount * amount

  const invoiceNumber = await generateInvoiceNumber(ctx.admin)
  const studentData = student as { full_name: string; parent_name: string | null }

  const { data: inserted, error } = await ctx.admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      class_id: classId,
      student_id: studentId,
      student_name: studentData.full_name,
      parent_name: studentData.parent_name ?? '',
      line_items: lineItems,
      total_due: totalDue,
      payment_method: 'Transfer Bank',
      bank_account: 'BSI - 7296753275 a.n. Suci Purnama Sari',
      due_date: addDays(issuedAt, 7),
      issued_at: issuedAt,
      status: 'draft',
      created_by: ctx.user.id,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/invoices')
  return { id: inserted.id }
}

// ─── Sync next invoice after payment change ────────────────────────────────────

async function syncNextInvoice(
  invoiceId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  // Load the invoice that triggered the sync to get student+class
  const { data: curr } = await admin
    .from('invoices')
    .select('student_id, class_id')
    .eq('id', invoiceId)
    .single() as { data: { student_id: string; class_id: string } | null }

  if (!curr?.student_id || !curr?.class_id) return

  // Fetch ALL invoices for this student+class, oldest first
  const { data: allInvoices } = await admin
    .from('invoices')
    .select('id, status, line_items, issued_at, created_at')
    .eq('student_id', curr.student_id)
    .eq('class_id', curr.class_id)
    .order('issued_at', { ascending: true })
    .order('created_at', { ascending: true }) as { data: { id: string; status: string; line_items: any[]; issued_at: string; created_at: string }[] | null }

  if (!allInvoices || allInvoices.length < 2) return

  // Find the draft invoice (the one to sync) — the latest one with status draft
  const draftInvoice = [...allInvoices].reverse().find(inv => inv.status === 'draft')
  if (!draftInvoice) return

  // Monthly-billed invoices (generateMonthlyInvoiceForStudent) are each
  // independent per month, not a cumulative multi-invoice chain — bail out
  // instead of overwriting the draft's own line items with another month's.
  // Checked on the draft itself (not allInvoices[0]) so this still holds
  // even if an older lump-sum invoice exists earlier in the same
  // student+class history (e.g. billing was switched from lump-sum to
  // monthly partway through).
  const draftLineItems = (draftInvoice.line_items ?? []) as Array<{ period?: string }>
  if (draftLineItems.some(i => i.period)) return

  // The first invoice's own line items (charges AND any embedded vouchers/
  // discounts) are carried forward as-is — only "Pembayaran Tahap N" items
  // are rebuilt fresh from actual payments below. Filtering out every
  // is_deduction item here would silently drop vouchers from the chain.
  const firstLineItems = (allInvoices[0].line_items ?? []) as Array<{ description: string; months: number; amount: number; is_deduction: boolean; period?: string }>

  // Collect ALL payments across every invoice EXCEPT the draft itself
  const precedingIds = allInvoices
    .filter(inv => inv.id !== draftInvoice.id)
    .map(inv => inv.id)

  if (precedingIds.length === 0) return

  const { data: paymentRows } = await admin
    .from('invoice_payments')
    .select('amount, paid_at, created_at')
    .in('invoice_id', precedingIds)
    .order('paid_at', { ascending: true })
    .order('created_at', { ascending: true }) as { data: { amount: number; paid_at: string; created_at: string }[] | null }

  const allPayments = paymentRows ?? []
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0)

  const deductionItems = allPayments.map((p, idx) => ({
    description: `Pembayaran Tahap ${idx + 1} (${new Date(p.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`,
    months: 0,
    amount: p.amount,
    is_deduction: true,
  }))

  const chargeTotal = firstLineItems.reduce((sum, item) =>
    item.is_deduction ? sum - lineSubtotal(item) : sum + lineSubtotal(item), 0)
  const newTotalDue = Math.max(0, chargeTotal - totalPaid)
  const newLineItems = [...firstLineItems, ...deductionItems]

  if (newTotalDue <= 0) {
    await admin.from('invoice_payments').delete().eq('invoice_id', draftInvoice.id)
    await admin.from('invoices').delete().eq('id', draftInvoice.id)
    return
  }

  await admin
    .from('invoices')
    .update({
      line_items: newLineItems,
      total_due: newTotalDue,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', draftInvoice.id)
}

export async function recordPayment(invoiceId: string, paymentAmount: number, paidAt?: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: invoice } = await ctx.admin
    .from('invoices')
    .select('total_due')
    .eq('id', invoiceId)
    .single() as { data: { total_due: number } | null }

  if (!invoice) return { error: 'Invoice tidak ditemukan' }
  if (paymentAmount <= 0) return { error: 'Jumlah pembayaran harus lebih dari 0' }

  const { data: existing } = await ctx.admin
    .from('invoice_payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  const alreadyPaid = (existing ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
  const remaining = invoice.total_due - alreadyPaid

  if (paymentAmount > remaining) return { error: 'Jumlah pembayaran melebihi sisa tagihan' }

  const { data: payment, error: insertError } = await ctx.admin
    .from('invoice_payments')
    .insert({ invoice_id: invoiceId, amount: paymentAmount, created_by: ctx.user.id, ...(paidAt ? { paid_at: paidAt } : {}) })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  const newPaid = alreadyPaid + paymentAmount
  const newStatus = newPaid >= invoice.total_due ? 'paid' : 'partially_paid'

  await ctx.admin
    .from('invoices')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  await syncNextInvoice(invoiceId, ctx.admin)

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${invoiceId}`)
  return { invoiceId, paymentId: payment.id }
}
