'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createHoliday,
  updateHoliday,
  deleteHoliday,
  cancelSessionsOnHoliday,
  getClashingSessions,
} from '@/lib/actions/admin/holidays'
import {
  HOLIDAY_KINDS,
  type Holiday,
  type HolidayKind,
  type ClashingSession,
} from '@/lib/holidays'

const KIND_BADGE: Record<HolidayKind, string> = {
  nasional: 'bg-red-50 text-red-700',
  cuti_bersama: 'bg-orange-50 text-orange-700',
  internal: 'bg-slate-100 text-slate-600',
}

function kindLabel(kind: HolidayKind) {
  return HOLIDAY_KINDS.find(k => k.value === kind)?.label ?? kind
}

function formatTanggal(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function todayWib() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function selisihHari(day: string, from: string) {
  const [y, m, d] = day.split('-').map(Number)
  const [fy, fm, fd] = from.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(fy, fm - 1, fd)) / 86400000)
}

/**
 * Kalender ini tidak mengisi dirinya sendiri.
 *
 * Dari 18 tanggal libur setahun, cuma lima yang jatuh di tanggal yang sama tiap
 * tahun; sisanya mengikuti kalender Hijriah, Saka, lunisolar, atau Paskah, dan
 * tanggal resminya baru pasti setelah SKB 3 Menteri terbit — biasanya sekitar
 * September untuk tahun berikutnya. Jadi tanggalnya memang dimasukkan manual
 * setahun sekali.
 *
 * Yang berbahaya bukan pekerjaan manualnya, tapi lupanya: kalender yang habis
 * tidak terlihat rusak, ia cuma diam, dan sesi kembali terjadwal di hari libur
 * persis seperti sebelum fitur ini ada. Karena itu halamannya yang menagih,
 * dua bulan sebelum tanggal terakhirnya lewat.
 */
const AMBANG_PERINGATAN_HARI = 60

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function HolidayManager({
  holidays,
  clashCounts,
}: {
  holidays: Holiday[]
  /** Jumlah sesi aktif yang bentrok per id libur, dihitung di server. */
  clashCounts: Record<string, number>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ holiday_date: todayWib(), name: '', kind: 'nasional' as HolidayKind })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ name: '', kind: 'nasional' as HolidayKind })
  const [confirmCancel, setConfirmCancel] = useState<{ holiday: Holiday; sessions: ClashingSession[] } | null>(null)

  function run(fn: () => Promise<{ error: string } | unknown>, onDone?: (res: unknown) => void) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === 'object' && 'error' in res) {
        setError((res as { error: string }).error)
        return
      }
      onDone?.(res)
      router.refresh()
    })
  }

  function openCancelDialog(holiday: Holiday) {
    setError(null)
    startTransition(async () => {
      const sessions = await getClashingSessions(holiday.holiday_date)
      setConfirmCancel({ holiday, sessions })
    })
  }

  const upcoming = holidays.filter(h => h.holiday_date >= todayWib())
  const past = holidays.filter(h => h.holiday_date < todayWib())

  // Dihitung sendiri, bukan mengandalkan urutan baris dari server — halaman ini
  // mengurutkan menurun, dan itu terlalu mudah berubah tanpa ada yang sadar
  // peringatan ini ikut rusak.
  const tanggalTerjauh = upcoming.reduce<string | null>(
    (max, h) => (max === null || h.holiday_date > max ? h.holiday_date : max),
    null,
  )
  const sisaHari = tanggalTerjauh ? selisihHari(tanggalTerjauh, todayWib()) : 0
  const perluDiisi = tanggalTerjauh === null || sisaHari < AMBANG_PERINGATAN_HARI

  function renderRow(h: Holiday) {
    const clash = clashCounts[h.id] ?? 0
    const isPast = h.holiday_date < todayWib()
    return (
      <tr key={h.id} className={`hover:bg-gray-50 ${isPast ? 'opacity-60' : ''}`}>
        <td className="px-5 py-3 whitespace-nowrap">
          <p className="font-medium text-gray-800">{formatTanggal(h.holiday_date)}</p>
        </td>
        <td className="px-4 py-3">
          {editingId === h.id ? (
            <input
              type="text"
              value={editDraft.name}
              onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
              className={inputClass}
            />
          ) : (
            <span className="text-gray-800">{h.name}</span>
          )}
        </td>
        <td className="px-4 py-3">
          {editingId === h.id ? (
            <select
              value={editDraft.kind}
              onChange={e => setEditDraft({ ...editDraft, kind: e.target.value as HolidayKind })}
              className={inputClass}
            >
              {HOLIDAY_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          ) : (
            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${KIND_BADGE[h.kind]}`}>
              {kindLabel(h.kind)}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {clash > 0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => openCancelDialog(h)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
            >
              {clash} sesi bentrok · batalkan
            </button>
          ) : (
            <span className="text-xs text-gray-400">tidak ada sesi</span>
          )}
        </td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          {editingId === h.id ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => updateHoliday(h.id, editDraft), () => setEditingId(null))}
                className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
              >
                Simpan
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="ml-3 text-xs text-gray-400 hover:underline">
                Batal
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setEditingId(h.id); setEditDraft({ name: h.name, kind: h.kind }) }}
                className="text-xs text-gray-500 hover:underline"
              >
                Ubah
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Hapus "${h.name}" dari kalender libur?\n\nSesi yang sudah terlanjur dibatalkan tidak akan dihidupkan kembali.`)) return
                  run(() => deleteHoliday(h.id))
                }}
                className="ml-3 text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                Hapus
              </button>
            </>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kalender Libur</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tanggal bimbel tidak mengajar. Sesi yang bentrok bisa dibatalkan dari sini, lengkap
            dengan alasannya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setAdding(v => !v); setError(null); setNotice(null) }}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {adding ? 'Batal' : '+ Tambah Tanggal Libur'}
        </button>
      </div>

      {perluDiisi && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="font-medium text-amber-900">
            {tanggalTerjauh === null
              ? 'Tidak ada tanggal libur akan datang di kalender.'
              : `Kalender libur habis setelah ${formatTanggal(tanggalTerjauh)}.`}
          </p>
          <p className="text-amber-800 mt-1">
            Tambahkan tanggal libur berikutnya, kalau tidak sesi akan terjadwal di hari
            libur seperti sebelum kalender ini ada. Tanggal resminya menunggu SKB 3
            Menteri, yang biasanya terbit sekitar September untuk tahun berikutnya.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
      {notice && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">{notice}</p>}

      {adding && (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={draft.holiday_date}
                onChange={e => setDraft({ ...draft, holiday_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Keterangan</label>
              <input
                type="text"
                value={draft.name}
                placeholder="Libur semester, Hari Jadi Kota, ..."
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Jenis</label>
              <select
                value={draft.kind}
                onChange={e => setDraft({ ...draft, kind: e.target.value as HolidayKind })}
                className={inputClass}
              >
                {HOLIDAY_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Menambah tanggal tidak otomatis membatalkan sesi. Setelah tersimpan, tombol
            &ldquo;sesi bentrok&rdquo; akan muncul kalau ada jadwal di tanggal itu.
          </p>
          <div className="mt-4">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(
                () => createHoliday(draft),
                () => { setAdding(false); setDraft({ holiday_date: todayWib(), name: '', kind: 'nasional' }) },
              )}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {[{ title: 'Akan Datang', rows: upcoming }, { title: 'Sudah Lewat', rows: past }].map(section => (
        section.rows.length === 0 ? null : (
          <div key={section.title} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {section.title} ({section.rows.length})
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Tanggal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Keterangan</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-40">Jenis</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-52">Sesi</th>
                  <th className="px-5 py-2.5 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">{section.rows.map(renderRow)}</tbody>
            </table>
          </div>
        )
      ))}

      {holidays.length === 0 && (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Belum ada tanggal libur tercatat.
        </div>
      )}

      {/* Konfirmasi pembatalan — sesi yang akan dibatalkan disebutkan satu per
          satu, karena membatalkan berarti tutornya tidak dibayar. */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Batalkan {confirmCancel.sessions.length} sesi pada {formatTanggal(confirmCancel.holiday.holiday_date)}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Alasannya akan terisi otomatis: &ldquo;{kindLabel(confirmCancel.holiday.kind)} — {confirmCancel.holiday.name}&rdquo;.
              Sesi yang dibatalkan tidak dihitung sebagai gaji tutor.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5">
              {confirmCancel.sessions.map(s => (
                <p key={s.id} className="text-sm text-gray-700">
                  <span className="text-gray-500">{new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  {' · '}{s.className}
                  <span className="text-gray-400"> · {s.tutorName}</span>
                </p>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(null)}
                disabled={pending}
                className="flex-1 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const target = confirmCancel
                  run(
                    () => cancelSessionsOnHoliday(target.holiday.id),
                    res => {
                      const n = (res as { cancelled: number }).cancelled
                      setConfirmCancel(null)
                      setNotice(`${n} sesi dibatalkan pada ${formatTanggal(target.holiday.holiday_date)}.`)
                    },
                  )
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-sm font-medium rounded-lg text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
