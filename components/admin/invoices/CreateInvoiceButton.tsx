'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoiceTambahan, generateFirstInvoice, generateMonthlyInvoiceForStudent } from '@/lib/actions/admin/invoices'

// Only classes with no invoice yet — per-class billing is meant to be a
// single invoice document (see "Kirim Pengingat" for ongoing installment
// reminders instead of issuing a new invoice each month).
export type GeneratableClass = {
  classId: string | null
  className: string
  studentId?: string
  studentName?: string
}

export type MonthlyInvoiceClass = {
  classId: string
  className: string
  studentId?: string
  studentName?: string
}

interface Props {
  studentId?: string
  generatableClasses: GeneratableClass[]
  monthlyClasses: MonthlyInvoiceClass[]
}

type Option =
  | { kind: 'persemester'; classId: string | null; className: string; studentId?: string; studentName?: string }
  | { kind: 'bulanan'; classId: string; className: string; studentId?: string; studentName?: string }

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function hariIni(): string {
  const now = new Date()
  return `${currentMonth()}-${String(now.getDate()).padStart(2, '0')}`
}

// Single "Buat Invoice" entry point. The billing model (semester lump-sum
// vs. monthly) is derived from the class itself — private classes bill
// monthly, everything else bills per semester — so the admin only ever
// picks a class, never a billing type.
export default function CreateInvoiceButton({ studentId, generatableClasses, monthlyClasses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Option | null>(null)
  const [month, setMonth] = useState(currentMonth())
  const [error, setError] = useState('')
  // Mode "sesi tambahan": invoice terpisah untuk sesi ekstra di luar paket bulanan.
  const [tambahan, setTambahan] = useState(false)
  const [sesi, setSesi] = useState(1)
  const [tanggal, setTanggal] = useState(hariIni())
  const [sudahDibayar, setSudahDibayar] = useState(true)

  const options: Option[] = [
    ...generatableClasses.map(gc => ({ kind: 'persemester' as const, ...gc })),
    ...monthlyClasses.map(mc => ({ kind: 'bulanan' as const, ...mc })),
  ]

  function reset() {
    setSelected(null)
    setMonth(currentMonth())
    setError('')
    setTambahan(false)
    setSesi(1)
    setTanggal(hariIni())
    setSudahDibayar(true)
  }

  function handleOpen() {
    reset()
    setOpen(true)
    if (options.length === 1) handleSelect(options[0])
  }

  function handleClose() {
    setOpen(false)
    reset()
  }

  function handleGenerateSemester(opt: Option & { kind: 'persemester' }) {
    setError('')
    startTransition(async () => {
      const sid = opt.studentId ?? studentId ?? ''
      const classId = opt.classId ?? ''
      const res = await generateFirstInvoice(sid, classId)
      if (res && 'error' in res) { setError(res.error ?? 'Gagal'); return }
      handleClose()
      router.refresh()
    })
  }

  function handleSelect(opt: Option) {
    setError('')
    setSelected(opt)
    if (opt.kind === 'persemester') handleGenerateSemester(opt)
  }

  function handleGenerateMonthly() {
    if (!selected || selected.kind !== 'bulanan') return
    setError('')
    startTransition(async () => {
      const sid = selected.studentId ?? studentId ?? ''
      const res = await generateMonthlyInvoiceForStudent(sid, selected.classId, month)
      if (res && 'error' in res) { setError(res.error ?? 'Gagal'); return }
      handleClose()
      router.refresh()
    })
  }

  function handleGenerateTambahan() {
    if (!selected || selected.kind !== 'bulanan') return
    setError('')
    startTransition(async () => {
      const sid = selected.studentId ?? studentId ?? ''
      const res = await createInvoiceTambahan({
        studentId: sid,
        classId: selected.classId,
        month,
        sessions: sesi,
        tanggal,
        sudahDibayar,
      })
      if (res && 'error' in res) { setError(res.error ?? 'Gagal'); return }
      handleClose()
      router.refresh()
    })
  }

  if (options.length === 0) return null

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Buat Invoice
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-gray-800">Buat Invoice</p>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(!selected || selected.kind === 'persemester') && (
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pilih Kelas</p>
                {options.map(opt => (
                  <button
                    key={`${opt.studentId ?? ''}__${opt.classId ?? '__no_class__'}`}
                    onClick={() => handleSelect(opt)}
                    disabled={isPending}
                    className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-colors"
                  >
                    <div>
                      {opt.studentName && <p className="text-xs text-gray-400">{opt.studentName}</p>}
                      <p className="text-sm font-medium text-gray-800">{opt.className}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{opt.kind === 'persemester' ? 'Persemester' : 'Bulanan'}</span>
                  </button>
                ))}
                {error && <p className="text-xs text-red-600 pt-1">{error}</p>}
              </div>
            )}

            {selected && selected.kind === 'bulanan' && (
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {options.length > 1 && (
                    <button
                      onClick={() => setSelected(null)}
                      className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Ganti kelas
                    </button>
                  )}
                  <span>Kelas: <span className="font-medium text-gray-600">{selected.className}</span></span>
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-sm">
                  {[
                    { nilai: false, label: 'Tagihan bulanan' },
                    { nilai: true, label: 'Sesi tambahan' },
                  ].map(m => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setTambahan(m.nilai)}
                      className={`py-1.5 rounded-lg font-medium transition-colors ${tambahan === m.nilai ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{tambahan ? 'Bulan Sesi' : 'Bulan Tagihan'}</label>
                  <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  {!tambahan && (
                    <p className="text-xs text-gray-400">Jumlah pertemuan dihitung otomatis dari sesi terjadwal di bulan ini.</p>
                  )}
                </div>

                {tambahan && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jumlah Sesi</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={sesi}
                          onChange={e => setSesi(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tanggal</label>
                        <input
                          type="date"
                          value={tanggal}
                          onChange={e => setTanggal(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={sudahDibayar}
                        onChange={e => setSudahDibayar(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Sudah dibayar lunas pada tanggal ini
                        <span className="block text-xs text-gray-400">
                          Pembayaran dicatat sekaligus, jadi kuitansinya langsung bisa dikirim.
                        </span>
                      </span>
                    </label>
                    <p className="text-xs text-gray-400">
                      Tarif per pertemuan mengikuti tarif kelas. Invoice bulanan yang sudah ada tidak diubah.
                    </p>
                  </>
                )}

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={tambahan ? handleGenerateTambahan : handleGenerateMonthly}
                    disabled={isPending}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-60 transition-colors"
                  >
                    {isPending ? 'Membuat...' : tambahan ? 'Buat Invoice Tambahan' : 'Buat Invoice'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
