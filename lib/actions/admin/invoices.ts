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
    .update({ amount, paid_at: paidAt, updated_at: new Date().toISOString() })
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

  const [{ data: student }, { data: cls }] = await Promise.all([
    ctx.admin.from('profiles').select('full_name, parent_name').eq('id', studentId).single(),
    ctx.admin.from('classes').select('name, level, class_type, start_date, end_date').eq('id', classId).single(),
  ])

  if (!student) return { error: 'Siswa tidak ditemukan' }
  if (!cls) return { error: 'Kelas tidak ditemukan' }

  const { data: rates } = await ctx.admin
    .from('billing_rates')
    .select('amount, jenis, billing_rate_periods!inner(is_active)')
    .eq('class_type', (cls as any).class_type)
    .eq('jenjang', (cls as any).level)
    .eq('billing_rate_periods.is_active', true)
    .limit(1) as any

  const rate = rates?.[0]
  const amount = rate ? Number(rate.amount) : 0
  const months = (cls as any).start_date && (cls as any).end_date
    ? monthsBetween((cls as any).start_date, (cls as any).end_date)
    : 1

  const typeLabel = (cls as any).class_type === 'private' ? 'Privat' : 'Grup'
  const description = [typeLabel, (cls as any).level, rate?.jenis].filter(Boolean).join(' ')
  const lineItems = [{ description, months, amount, is_deduction: false }]
  const totalDue = months * amount

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

// ─── Sync next invoice after payment change ────────────────────────────────────

async function syncNextInvoice(
  invoiceId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  // Load current invoice
  const { data: curr } = await admin
    .from('invoices')
    .select('student_id, class_id, issued_at, total_due, line_items')
    .eq('id', invoiceId)
    .single() as { data: { student_id: string; class_id: string; issued_at: string; total_due: number; line_items: Array<{ is_deduction?: boolean; months: number; amount: number; description: string }> } | null }

  if (!curr?.student_id || !curr?.class_id) return

  // Find the immediately next invoice for same student+class
  const { data: next } = await admin
    .from('invoices')
    .select('id, status')
    .eq('student_id', curr.student_id)
    .eq('class_id', curr.class_id)
    .gt('issued_at', curr.issued_at)
    .order('issued_at', { ascending: true })
    .limit(1)
    .single() as { data: { id: string; status: string } | null }

  if (!next) return

  // All payments for the current invoice
  const { data: payments } = await admin
    .from('invoice_payments')
    .select('amount, paid_at')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true }) as { data: { amount: number; paid_at: string }[] | null }

  const allPayments = payments ?? []
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0)

  // Rebuild next invoice line_items: current charge items + deduction rows
  const chargeItems = curr.line_items.filter(i => !i.is_deduction)
  const deductionItems = allPayments.map((p, idx) => ({
    description: `Pembayaran Tahap ${idx + 1} (${new Date(p.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`,
    months: 0,
    amount: p.amount,
    is_deduction: true,
  }))

  const newLineItems = [...chargeItems, ...deductionItems]
  const newTotalDue = curr.total_due - totalPaid

  const newStatus = newTotalDue <= 0
    ? 'paid'
    : next.status === 'paid'
      ? 'partially_paid'
      : next.status

  await admin
    .from('invoices')
    .update({
      line_items: newLineItems,
      total_due: Math.max(0, newTotalDue),
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', next.id)
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

export async function generateNextInvoice(studentId: string, classId: string, paymentAmount: number) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: prevInvoice } = await ctx.admin
    .from('invoices')
    .select('id, total_due, issued_at, student_name, parent_name, line_items')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .order('issued_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any

  if (!prevInvoice) return { error: 'Invoice sebelumnya tidak ditemukan' }

  const prevLineItems = (prevInvoice.line_items ?? []) as Array<{
    description: string; months: number; amount: number; is_deduction: boolean
  }>

  // Charge items from previous invoice (non-deduction rows)
  const chargeItems = prevLineItems.filter(item => !item.is_deduction)

  // Fetch actual payments from invoice_payments for the previous invoice
  const { data: payments } = await ctx.admin
    .from('invoice_payments')
    .select('id, amount, paid_at')
    .eq('invoice_id', prevInvoice.id)
    .order('paid_at', { ascending: true })
    .order('created_at', { ascending: true }) as any

  const allPayments: Array<{ id: string; amount: number; paid_at: string }> = payments ?? []

  // Build deduction line items from actual payment records
  const deductionItems = allPayments.map((p, idx) => {
    const date = new Date(p.paid_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    return {
      description: `Pembayaran Tahap ${idx + 1} (${date})`,
      months: 0,
      amount: p.amount,
      is_deduction: true,
    }
  })

  // Optionally append a new payment passed by caller
  if (paymentAmount > 0) {
    const paymentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    deductionItems.push({
      description: `Pembayaran Tahap ${allPayments.length + 1} (${paymentDate})`,
      months: 0,
      amount: paymentAmount,
      is_deduction: true,
    })
  }

  const newDeductionIndex = paymentAmount > 0 ? chargeItems.length + deductionItems.length - 1 : null
  const lineItems = [...chargeItems, ...deductionItems]

  // Total = sum of charges - sum of all deductions (months=0 items use amount directly)
  const lineSubtotal = (item: { months: number; amount: number }) =>
    item.months === 0 ? item.amount : item.months * item.amount

  const newTotal = lineItems.reduce((sum, item) =>
    item.is_deduction ? sum - lineSubtotal(item) : sum + lineSubtotal(item), 0)

  if (newTotal < 0) return { error: 'Jumlah pembayaran melebihi saldo tagihan' }

  const issuedAt = firstOfCurrentMonth()
  const invoiceNumber = await generateInvoiceNumber(ctx.admin)

  const { data: inserted, error } = await ctx.admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      class_id: classId,
      student_id: studentId,
      student_name: prevInvoice.student_name,
      parent_name: prevInvoice.parent_name,
      line_items: lineItems,
      total_due: newTotal,
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
  return { id: inserted.id, kuitansiItemIndex: newDeductionIndex ?? null }
}

// ─── Batch draft generation ────────────────────────────────────────────────────

export async function generateDraftInvoices(
  month: string
): Promise<{ generated: number; skipped: number; error?: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { generated: 0, skipped: 0, error: 'Tidak diizinkan' }

  const issuedAt = `${month}-01`
  const dueDate = addDays(issuedAt, 7)
  const [year, mon] = month.split('-').map(Number)
  const nextMonthStr = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`

  // All active enrollments
  const { data: enrollments } = await ctx.admin
    .from('class_students')
    .select(`
      student_id,
      class_id,
      profiles!student_id(full_name, parent_name),
      classes!class_id(name, level, class_type, start_date, end_date)
    `)
    .eq('is_active', true) as unknown as {
      data: {
        student_id: string
        class_id: string
        profiles: { full_name: string; parent_name: string | null } | null
        classes: { name: string; level: string | null; class_type: string | null; start_date: string | null; end_date: string | null } | null
      }[] | null
    }

  if (!enrollments || enrollments.length === 0) return { generated: 0, skipped: 0 }

  // Invoices already existing this month (skip these)
  const { data: existing } = await ctx.admin
    .from('invoices')
    .select('student_id, class_id')
    .gte('issued_at', issuedAt)
    .lt('issued_at', nextMonthStr)

  const existingSet = new Set((existing ?? []).map(i => `${i.student_id}:${i.class_id}`))

  // Private class IDs that need session counts
  const privateClassIds = [...new Set(
    enrollments
      .filter(e => e.classes?.class_type === 'private' && !existingSet.has(`${e.student_id}:${e.class_id}`))
      .map(e => e.class_id)
  )]

  // Count scheduled sessions per class for this month (for private billing)
  const sessionCountByClass = new Map<string, number>()
  if (privateClassIds.length > 0) {
    const { data: sessions } = await ctx.admin
      .from('sessions')
      .select('class_id')
      .in('class_id', privateClassIds)
      .gte('scheduled_at', issuedAt)
      .lt('scheduled_at', nextMonthStr)
      .neq('status', 'cancelled')

    for (const s of sessions ?? []) {
      sessionCountByClass.set(s.class_id, (sessionCountByClass.get(s.class_id) ?? 0) + 1)
    }
  }

  // Most recent previous invoice per student+class (for group carry-forward)
  const { data: prevInvoices } = await ctx.admin
    .from('invoices')
    .select('id, student_id, class_id, total_due, student_name, parent_name, line_items')
    .lt('issued_at', issuedAt)
    .order('issued_at', { ascending: false }) as unknown as {
      data: { id: string; student_id: string; class_id: string; total_due: number; student_name: string; parent_name: string; line_items: unknown[] }[] | null
    }

  const prevMap = new Map<string, { id: string; total_due: number; student_name: string; parent_name: string; line_items: unknown[] }>()
  for (const inv of prevInvoices ?? []) {
    const key = `${inv.student_id}:${inv.class_id}`
    if (!prevMap.has(key)) prevMap.set(key, inv)
  }

  // Payments for all previous invoices
  const prevInvoiceIds = [...prevMap.values()].map(i => i.id)
  const paymentsByInvoice = new Map<string, { amount: number; paid_at: string }[]>()
  if (prevInvoiceIds.length > 0) {
    const { data: prevPayments } = await ctx.admin
      .from('invoice_payments')
      .select('invoice_id, amount, paid_at')
      .in('invoice_id', prevInvoiceIds)
      .order('created_at', { ascending: true }) as unknown as {
        data: { invoice_id: string; amount: number; paid_at: string }[] | null
      }
    for (const p of prevPayments ?? []) {
      if (!paymentsByInvoice.has(p.invoice_id)) paymentsByInvoice.set(p.invoice_id, [])
      paymentsByInvoice.get(p.invoice_id)!.push(p)
    }
  }

  // Active billing rates
  const { data: rates } = await ctx.admin
    .from('billing_rates')
    .select('amount, class_type, jenjang, jenis, billing_rate_periods!inner(is_active)')
    .eq('billing_rate_periods.is_active', true) as unknown as {
      data: { amount: number; class_type: string; jenjang: string; jenis: string }[] | null
    }

  const rateMap = new Map<string, number>()
  for (const r of rates ?? []) {
    rateMap.set(`${r.class_type}|${r.jenjang}|${r.jenis}`, r.amount)
  }

  function getRate(classType: string | null, jenjang: string | null): number {
    if (!classType || !jenjang) return 0
    return rateMap.get(`${classType}|${jenjang}|Reguler`) ?? rateMap.get(`${classType}|${jenjang}|Fokus`) ?? 0
  }

  const toInsert: object[] = []
  let skipped = 0

  for (const e of enrollments) {
    const key = `${e.student_id}:${e.class_id}`

    // Skip if already invoiced this month
    if (existingSet.has(key)) { skipped++; continue }

    const cls = e.classes
    const isPrivate = cls?.class_type === 'private'
    const studentName = e.profiles?.full_name ?? ''
    const parentName = e.profiles?.parent_name ?? ''
    const prev = prevMap.get(key)

    let lineItems: object[]
    let totalDue: number

    if (isPrivate) {
      // Private: fresh invoice every month based on planned sessions
      const sessionCount = sessionCountByClass.get(e.class_id) ?? 0
      if (sessionCount === 0) { skipped++; continue } // no sessions planned, skip

      const ratePerSession = getRate(cls?.class_type ?? null, cls?.level ?? null)
      const description = `Privat${cls?.level ? ` ${cls.level}` : ''} — ${sessionCount} pertemuan`
      lineItems = [{ description, months: sessionCount, amount: ratePerSession, is_deduction: false }]
      totalDue = sessionCount * ratePerSession

    } else {
      // Group: first invoice for full period, then carry forward unpaid balance
      if (prev) {
        const payments = paymentsByInvoice.get(prev.id) ?? []
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
        const remaining = prev.total_due - totalPaid
        if (remaining <= 0) { skipped++; continue } // fully paid, skip

        const chargeItems = (prev.line_items as Array<{ is_deduction?: boolean }>).filter(i => !i.is_deduction)
        const deductionItems = payments.map((p, idx) => ({
          description: `Pembayaran Tahap ${idx + 1} (${new Date(p.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`,
          months: 0,
          amount: p.amount,
          is_deduction: true,
        }))
        lineItems = [...chargeItems, ...deductionItems]
        totalDue = remaining
      } else {
        // First invoice: total for full enrollment period
        const amount = getRate(cls?.class_type ?? null, cls?.level ?? null)
        const months = cls?.start_date && cls?.end_date
          ? monthsBetween(cls.start_date, cls.end_date)
          : 1
        const description = `Grup${cls?.level ? ` ${cls.level}` : ''} — ${months} bulan`
        lineItems = [{ description, months, amount, is_deduction: false }]
        totalDue = months * amount
      }
    }

    const invoiceNumber = await generateInvoiceNumber(ctx.admin)

    toInsert.push({
      invoice_number: invoiceNumber,
      class_id: e.class_id,
      student_id: e.student_id,
      student_name: studentName,
      parent_name: parentName,
      line_items: lineItems,
      total_due: totalDue,
      payment_method: 'Transfer Bank',
      bank_account: 'BSI - 7296753275 a.n. Suci Purnama Sari',
      due_date: dueDate,
      issued_at: issuedAt,
      status: 'draft',
      created_by: ctx.user.id,
      updated_at: new Date().toISOString(),
    })
  }

  if (toInsert.length > 0) {
    const { error } = await ctx.admin.from('invoices').insert(toInsert)
    if (error) return { generated: 0, skipped: enrollments.length, error: error.message }
  }

  revalidatePath('/admin/invoices')
  return { generated: toInsert.length, skipped }
}
