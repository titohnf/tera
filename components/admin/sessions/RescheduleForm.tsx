'use client'

import { useState, useActionState, useTransition } from 'react'
import { rescheduleSession } from '@/lib/actions/admin/sessions'
import DatePicker from '@/components/ui/DatePicker'
import TimePicker from '@/components/ui/TimePicker'

type ActionState = { error: string } | null

export default function RescheduleForm({
  sessionId,
  currentScheduledAt,
  currentStatus,
  open: externalOpen,
  onClose,
}: {
  sessionId: string
  currentScheduledAt: string
  currentStatus: string
  open?: boolean
  onClose?: () => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (externalOpen !== undefined) {
      if (!val) onClose?.()
    } else {
      setInternalOpen(val)
    }
  }
  const [, startTransition] = useTransition()

  const parsed = new Date(currentScheduledAt)
  const defaultDate = parsed.toISOString().split('T')[0]
  const defaultTime = parsed.toTimeString().slice(0, 5)

  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime)

  const rescheduleWithId = rescheduleSession.bind(null, sessionId)

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await rescheduleWithId(prev, formData)
      if (!result) setOpen(false)
      return result
    },
    null
  )

  if (currentStatus === 'completed' || !open) return null

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-3">Jadwalkan Ulang Sesi</p>
      <form action={(formData) => startTransition(() => { formAction(formData) })} className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
            <DatePicker name="date" required value={date} onChange={setDate} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Waktu</label>
            <input type="hidden" name="time" value={time} required />
            <TimePicker value={time} onChange={setTime} />
          </div>
        </div>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Jadwal Baru'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
