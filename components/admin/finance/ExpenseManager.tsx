'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createExpense,
  updateExpense,
  deleteExpense,
  copyExpensesFromPreviousMonth,
} from '@/lib/actions/admin/expenses'
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  formatMonthLabel,
  shiftMonth,
  type OperationalExpense,
} from '@/lib/finance/laba-rugi'

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

type Draft = {
  incurred_on: string
  category: string
  description: string
  amount: string
  notes: string
}

function emptyDraft(month: string): Draft {
  return { incurred_on: `${month}-01`, category: 'sewa', description: '', amount: '', notes: '' }
}

const inputClass =
  'w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function DraftFields({
  draft, month, onChange,
}: {
  draft: Draft
  month: string
  onChange: (d: Draft) => void
}) {
  // Halaman ini selalu menampilkan satu bulan, jadi tanggal di luar bulan itu
  // akan tersimpan lalu langsung menghilang dari layar. Batasi di input-nya.
  const [y, m] = month.split('-').map(Number)
  const start = `${month}-01`
  const end = `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`
  return (
    <>
      <td className="px-3 py-2">
        <input
          type="date"
          value={draft.incurred_on}
          min={start}
          max={end}
          onChange={e => onChange({ ...draft, incurred_on: e.target.value })}
          className={inputClass}
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={draft.category}
          onChange={e => onChange({ ...draft, category: e.target.value })}
          className={inputClass}
        >
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={draft.description}
          placeholder="Sewa ruko, token listrik, ..."
          onChange={e => onChange({ ...draft, description: e.target.value })}
          className={inputClass}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={draft.amount}
          placeholder="0"
          onChange={e => onChange({ ...draft, amount: e.target.value })}
          className={`${inputClass} text-right`}
        />
      </td>
    </>
  )
}

export default function ExpenseManager({
  month,
  expenses,
  total,
}: {
  month: string
  expenses: OperationalExpense[]
  total: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(month))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(() => emptyDraft(month))

  function run(fn: () => Promise<{ error: string } | { copied: number } | null>, onDone?: () => void) {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res && 'error' in res) {
        setError(res.error)
        return
      }
      onDone?.()
      router.refresh()
    })
  }

  function toInput(d: Draft) {
    return {
      incurred_on: d.incurred_on,
      category: d.category,
      description: d.description,
      amount: Number(d.amount),
      notes: d.notes || null,
    }
  }

  function startEdit(e: OperationalExpense) {
    setError(null)
    setAdding(false)
    setEditingId(e.id)
    setEditDraft({
      incurred_on: e.incurred_on,
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      notes: e.notes ?? '',
    })
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Biaya Operasional</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pengeluaran {formatMonthLabel(month)} di luar gaji tutor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expenses.length === 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => copyExpensesFromPreviousMonth(month))}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Salin dari {formatMonthLabel(shiftMonth(month, -1))}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEditingId(null)
              setError(null)
              setDraft(emptyDraft(month))
              setAdding(v => !v)
            }}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? 'Batal' : '+ Tambah Biaya'}
          </button>
        </div>
      </div>

      {error && (
        <p className="px-5 py-2.5 text-xs text-red-600 bg-red-50 border-b border-red-100">{error}</p>
      )}

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-36">Tanggal</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-52">Kategori</th>
            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Keterangan</th>
            <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-40">Nominal</th>
            <th className="px-3 py-2.5 w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {adding && (
            <tr className="bg-blue-50/40">
              <DraftFields draft={draft} month={month} onChange={setDraft} />
              <td className="px-3 py-2 text-right whitespace-nowrap">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => createExpense(toInput(draft)), () => {
                    setAdding(false)
                    setDraft(emptyDraft(month))
                  })}
                  className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                >
                  Simpan
                </button>
              </td>
            </tr>
          )}

          {expenses.length === 0 && !adding && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                Belum ada biaya operasional tercatat di {formatMonthLabel(month)}.
                <br />
                <span className="text-xs text-gray-400">
                  Tanpa ini, laba yang tampil masih terhitung terlalu besar.
                </span>
              </td>
            </tr>
          )}

          {expenses.map(e =>
            editingId === e.id ? (
              <tr key={e.id} className="bg-blue-50/40">
                <DraftFields draft={editDraft} month={month} onChange={setEditDraft} />
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => updateExpense(e.id, toInput(editDraft)), () => setEditingId(null))}
                    className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="ml-3 text-xs text-gray-400 hover:underline"
                  >
                    Batal
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{formatTanggal(e.incurred_on)}</td>
                <td className="px-3 py-2.5 text-gray-600">{expenseCategoryLabel(e.category)}</td>
                <td className="px-3 py-2.5 text-gray-800">{e.description}</td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-800">{formatRp(e.amount)}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => startEdit(e)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Hapus biaya "${e.description}"?`)) return
                      run(() => deleteExpense(e.id))
                    }}
                    className="ml-3 text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
        {expenses.length > 0 && (
          <tfoot className="border-t border-gray-100 bg-gray-50">
            <tr>
              <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-gray-600">
                Total biaya operasional
              </td>
              <td className="px-3 py-2.5 text-right text-sm font-semibold text-gray-800">
                {formatRp(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
