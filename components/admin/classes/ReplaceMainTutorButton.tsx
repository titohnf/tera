'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { replaceMainTutor } from '@/lib/actions/admin/tutor-swap'

interface TutorOption {
  id: string
  full_name: string
}

interface Props {
  classId: string
  className: string
  currentTutors: TutorOption[]
  allTutors: TutorOption[]
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export default function ReplaceMainTutorButton({ classId, className, currentTutors, allTutors }: Props) {
  const [open, setOpen] = useState(false)
  const [oldTutorId, setOldTutorId] = useState(currentTutors[0]?.id ?? '')
  const [newTutorId, setNewTutorId] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(todayStr())
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const newTutorOptions = allTutors.filter(t => t.id !== oldTutorId)

  function reset() {
    setOldTutorId(currentTutors[0]?.id ?? '')
    setNewTutorId('')
    setEffectiveDate(todayStr())
    setError(null)
    setResult(null)
  }

  function handleSubmit() {
    if (!oldTutorId || !newTutorId) {
      setError('Pilih tutor lama dan tutor pengganti')
      return
    }
    if (!effectiveDate) {
      setError('Tanggal berlaku wajib diisi')
      return
    }
    const oldName = currentTutors.find(t => t.id === oldTutorId)?.full_name ?? 'tutor ini'
    const newName = allTutors.find(t => t.id === newTutorId)?.full_name ?? 'tutor pengganti'
    const effectiveLabel = new Date(`${effectiveDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!confirm(`Ganti ${oldName} dengan ${newName} sebagai tutor kelas "${className}", berlaku mulai ${effectiveLabel}? Sesi terjadwal mulai tanggal itu yang belum diisi jurnal akan dipindah ke ${newName}.`)) return

    setError(null)
    startTransition(async () => {
      const res = await replaceMainTutor(classId, oldTutorId, newTutorId, effectiveDate)
      if (res.error) {
        setError(res.error)
        return
      }
      setResult(`Berhasil. ${res.movedCount ?? 0} sesi terjadwal dipindah ke tutor baru.`)
    })
  }

  if (currentTutors.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 border border-slate-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Ganti Tutor Utama
      </button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ganti Tutor Utama</DialogTitle>
          <DialogDescription>
            Sesi terjadwal di kelas ini milik tutor lama, mulai tanggal berlaku dan belum diisi jurnal (topik, presensi, materi, atau asesmen), akan dipindah ke tutor pengganti. Sesi sebelum tanggal berlaku, sesi yang sudah selesai, atau sesi yang sudah ada isian jurnal tidak ikut berubah.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tutor yang diganti
            </label>
            <select
              value={oldTutorId}
              onChange={e => { setOldTutorId(e.target.value); setNewTutorId('') }}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {currentTutors.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tutor pengganti
            </label>
            <select
              value={newTutorId}
              onChange={e => setNewTutorId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Pilih tutor pengganti —</option>
              {newTutorOptions.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Berlaku mulai tanggal
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Sesi sebelum tanggal ini tetap milik tutor lama.</p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {result && <p className="text-xs text-green-600">{result}</p>}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !newTutorId}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isPending ? 'Memproses...' : 'Ganti Tutor'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
