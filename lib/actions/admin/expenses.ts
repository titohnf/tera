'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import {
  EXPENSE_CATEGORY_VALUES,
  monthRangeDate,
  shiftMonth,
  isValidMonth,
} from '@/lib/finance/laba-rugi'

export type ExpenseInput = {
  incurred_on: string
  category: string
  description: string
  amount: number
  notes?: string | null
}

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { admin, userId: user.id }
}

function validate(input: ExpenseInput): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.incurred_on)) return 'Tanggal tidak valid'
  if (!EXPENSE_CATEGORY_VALUES.includes(input.category)) return 'Kategori tidak dikenal'
  if (!input.description.trim()) return 'Keterangan wajib diisi'
  if (!Number.isFinite(input.amount) || input.amount <= 0) return 'Nominal harus lebih dari nol'
  return null
}

/** Dashboard ikut menampilkan biaya operasional di grafik kas, jadi ikut disegarkan. */
function revalidateFinance() {
  revalidatePath('/admin/finance')
  revalidatePath('/admin')
}

export async function createExpense(input: ExpenseInput): Promise<{ error: string } | null> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const invalid = validate(input)
  if (invalid) return { error: invalid }

  const { error } = await ctx.admin.from('operational_expenses').insert({
    incurred_on: input.incurred_on,
    category: input.category,
    description: input.description.trim(),
    amount: input.amount,
    notes: input.notes?.trim() || null,
    created_by: ctx.userId,
  })
  if (error) return { error: error.message }

  revalidateFinance()
  return null
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
): Promise<{ error: string } | null> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const invalid = validate(input)
  if (invalid) return { error: invalid }

  const { error } = await ctx.admin
    .from('operational_expenses')
    .update({
      incurred_on: input.incurred_on,
      category: input.category,
      description: input.description.trim(),
      amount: input.amount,
      notes: input.notes?.trim() || null,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidateFinance()
  return null
}

export async function deleteExpense(id: string): Promise<{ error: string } | null> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin.from('operational_expenses').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidateFinance()
  return null
}

/**
 * Menyalin biaya bulan sebelumnya ke bulan `month`.
 *
 * Biaya rutin (sewa, listrik, internet) sama tiap bulan dan mengetik ulangnya
 * adalah alasan paling sering laporan bulan berjalan dibiarkan kosong. Tanggal
 * disalin apa adanya ke bulan tujuan — kalau tanggalnya tidak ada di bulan itu
 * (31 di bulan berisi 30 hari), dipakai tanggal terakhir bulan tersebut.
 *
 * Menolak jalan kalau bulan tujuan sudah ada isinya, supaya menekan tombolnya
 * dua kali tidak menggandakan biaya — itu kesalahan yang tidak kelihatan di
 * angka total sampai ada yang mencocokkan barisnya satu per satu.
 */
export async function copyExpensesFromPreviousMonth(
  month: string,
): Promise<{ error: string } | { copied: number }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  if (!isValidMonth(month)) return { error: 'Bulan tidak valid' }

  const target = monthRangeDate(month)
  const { count: existing } = await ctx.admin
    .from('operational_expenses')
    .select('*', { count: 'exact', head: true })
    .gte('incurred_on', target.start)
    .lt('incurred_on', target.end)

  if ((existing ?? 0) > 0) {
    return { error: 'Bulan ini sudah punya catatan biaya. Hapus dulu kalau mau menyalin ulang.' }
  }

  const source = monthRangeDate(shiftMonth(month, -1))
  const { data: rows, error: readErr } = await ctx.admin
    .from('operational_expenses')
    .select('incurred_on, category, description, amount, notes')
    .gte('incurred_on', source.start)
    .lt('incurred_on', source.end)
  if (readErr) return { error: readErr.message }
  if (!rows || rows.length === 0) return { error: 'Bulan lalu belum ada catatan biaya untuk disalin.' }

  const [year, mon] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate()

  const { error: insErr } = await ctx.admin.from('operational_expenses').insert(
    rows.map(r => {
      const day = Math.min(Number(r.incurred_on.slice(8, 10)), lastDay)
      return {
        incurred_on: `${month}-${String(day).padStart(2, '0')}`,
        category: r.category,
        description: r.description,
        amount: r.amount,
        notes: r.notes,
        created_by: ctx.userId,
      }
    }),
  )
  if (insErr) return { error: insErr.message }

  revalidateFinance()
  return { copied: rows.length }
}
