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

export async function updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'paid') {
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

  // Keep original charge rows, accumulate all previous payment deductions
  const chargeItems = prevLineItems.filter(item => !item.is_deduction)
  const prevDeductions = prevLineItems.filter(item => item.is_deduction)
  const tahapNumber = prevDeductions.length + 1

  const paymentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const newDeductionIndex = paymentAmount > 0 ? chargeItems.length + prevDeductions.length : null

  const lineItems = paymentAmount > 0
    ? [
        ...chargeItems,
        ...prevDeductions,
        {
          description: `Pembayaran Tahap ${tahapNumber} (${paymentDate})`,
          months: 0,
          amount: paymentAmount,
          is_deduction: true,
        },
      ]
    : [...chargeItems, ...prevDeductions]

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
