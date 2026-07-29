'use client'

import { useState, useTransition } from 'react'
import { saveMonthlyReportNotes } from '@/lib/actions/admin/monthly-report-notes'

export default function ReportNotesForm({
  studentId,
  month,
  initial,
}: {
  studentId: string
  month: string
  initial: { mastered: string | null; needs_practice: string | null; other_notes: string | null }
}) {
  const [mastered, setMastered] = useState(initial.mastered ?? '')
  const [needsPractice, setNeedsPractice] = useState(initial.needs_practice ?? '')
  const [otherNotes, setOtherNotes] = useState(initial.other_notes ?? '')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function handleSave() {
    setStatus('idle')
    startTransition(async () => {
      const result = await saveMonthlyReportNotes({
        student_id: studentId,
        month,
        mastered,
        needs_practice: needsPractice,
        other_notes: otherNotes,
      })
      setStatus(result.error ? 'error' : 'saved')
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Yang Sudah Dikuasai</label>
        <textarea
          value={mastered}
          onChange={e => setMastered(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tuliskan hal-hal yang sudah dikuasai siswa bulan ini…"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Yang Masih Perlu Dilatih</label>
        <textarea
          value={needsPractice}
          onChange={e => setNeedsPractice(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tuliskan hal-hal yang masih perlu dilatih…"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Catatan Lainnya</label>
        <textarea
          value={otherNotes}
          onChange={e => setOtherNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Catatan tambahan lainnya…"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Menyimpan…' : 'Simpan Catatan'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-600">Tersimpan.</span>}
        {status === 'error' && <span className="text-xs text-red-500">Gagal menyimpan.</span>}
      </div>
    </div>
  )
}
