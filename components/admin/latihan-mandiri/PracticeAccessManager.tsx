'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  enablePracticeForStudent,
  reissueCode,
  revokeCode,
  createExternalLearner,
  deleteExternalLearner,
  setTutorPenanggungJawab,
} from '@/lib/actions/admin/practice-access'

export type LearnerRow = {
  id: string
  profile_id: string | null
  name: string
  access_code: string | null
  /** Tutor yang menerima eskalasi murid ini (PRD FR9). */
  tutor_penanggung_jawab_id: string | null
  finishedSessions: number
}

export type TutorRow = {
  id: string
  full_name: string
}

export type StudentRow = {
  id: string
  full_name: string
  is_active: boolean
}

/**
 * Kode akses untuk latihan mandiri di QuizCraft. Murid tidak punya akun: kode
 * inilah yang mereka ketik sekali di halaman latihan, lalu diingat perangkatnya.
 *
 * Dua jenis murid hidup berdampingan di sini. Murid Tera terpaut ke profilnya,
 * jadi hasil latihannya bisa masuk Laporan Bulanan. Murid luar tidak punya
 * profil dan hanya berlatih.
 */
export default function PracticeAccessManager({
  learners,
  unlinkedStudents,
  tutors,
}: {
  learners: LearnerRow[]
  unlinkedStudents: StudentRow[]
  tutors: TutorRow[]
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [externalState, externalAction] = useActionState(createExternalLearner, null)

  const teraLearners = learners.filter(l => l.profile_id)
  const externalLearners = learners.filter(l => !l.profile_id)
  const visibleUnlinked = unlinkedStudents.filter(s => showInactive || s.is_active)

  function run(action: () => Promise<{ error: string } | null>) {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) setMessage(result.error)
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Latihan Mandiri</h1>
      <p className="mt-1 text-sm text-gray-500">
        Bagikan kode di bawah ke murid. Mereka membukanya di halaman latihan QuizCraft, mengetik
        kodenya sekali, lalu bisa berlatih kapan saja sesuai topik kurikulum.
      </p>

      {message && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
      )}

      {/* Murid Tera ------------------------------------------------------- */}

      <h2 className="mt-8 text-sm font-medium text-gray-700">
        Murid Tera ({teraLearners.length} punya akses)
      </h2>

      <div className="mt-2 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
        {teraLearners.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Belum ada murid yang diberi akses latihan.</p>
        )}
        {teraLearners.map(learner => (
          <LearnerRowView
            key={learner.id}
            learner={learner}
            pending={pending}
            tutors={tutors}
            onReissue={() => run(() => reissueCode(learner.id))}
            onRevoke={() => run(() => revokeCode(learner.id))}
            onPenanggungJawab={id => run(() => setTutorPenanggungJawab(learner.id, id))}
          />
        ))}
      </div>

      {/* Belum diberi akses ------------------------------------------------ */}

      {unlinkedStudents.length > 0 && (
        <>
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">
              Belum diberi akses ({visibleUnlinked.length})
            </h2>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
              />
              Tampilkan murid non-aktif
            </label>
          </div>

          <div className="mt-2 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {visibleUnlinked.length === 0 && (
              <p className="p-4 text-sm text-gray-500">Semua murid aktif sudah punya akses.</p>
            )}
            {visibleUnlinked.map(student => (
              <div key={student.id} className="flex items-center justify-between p-3">
                <span className="text-sm">
                  {student.full_name}
                  {!student.is_active && (
                    <span className="ml-2 text-xs text-gray-400">non-aktif</span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => enablePracticeForStudent(student.id))}
                  className="rounded border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Terbitkan kode
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Murid luar -------------------------------------------------------- */}

      <h2 className="mt-8 text-sm font-medium text-gray-700">
        Murid luar Tera ({externalLearners.length})
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Untuk yang ikut latihan tapi belum jadi murid bimbel. Tidak masuk kelas, absensi, maupun
        Laporan Bulanan.
      </p>

      <form action={externalAction} className="mt-2 flex gap-2">
        <input
          name="name"
          required
          placeholder="Nama murid luar"
          className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700"
        >
          Tambah &amp; terbitkan kode
        </button>
      </form>
      {externalState?.error && (
        <p className="mt-2 text-sm text-red-700">{externalState.error}</p>
      )}

      <div className="mt-2 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
        {externalLearners.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Belum ada murid luar.</p>
        )}
        {externalLearners.map(learner => (
          <LearnerRowView
            key={learner.id}
            learner={learner}
            pending={pending}
            tutors={tutors}
            onReissue={() => run(() => reissueCode(learner.id))}
            onRevoke={() => run(() => revokeCode(learner.id))}
            onPenanggungJawab={id => run(() => setTutorPenanggungJawab(learner.id, id))}
            onDelete={() => run(() => deleteExternalLearner(learner.id))}
          />
        ))}
      </div>
    </div>
  )
}

function LearnerRowView({
  learner,
  pending,
  tutors,
  onReissue,
  onRevoke,
  onPenanggungJawab,
  onDelete,
}: {
  learner: LearnerRow
  pending: boolean
  tutors: TutorRow[]
  onReissue: () => void
  onRevoke: () => void
  onPenanggungJawab: (tutorId: string | null) => void
  onDelete?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3">
      <div>
        <p className="text-sm font-medium">{learner.name}</p>
        <p className="text-xs text-gray-400">
          {learner.finishedSessions === 0
            ? 'belum pernah latihan'
            : `${learner.finishedSessions} sesi selesai`}
        </p>
        {/*
          Penanggung jawab pengukuran (FR9). Ditaruh di sini, bukan di layar
          sendiri, karena inilah satu-satunya halaman tempat baris `learners`
          benar-benar dikelola — dan penanggung jawab yang kosong bukan
          kekurangan kecil: tanpanya murid ini akan ditolak saat membuka paket
          pengukuran pertamanya.
        */}
        <label className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
          <span>Penanggung jawab</span>
          <select
            value={learner.tutor_penanggung_jawab_id ?? ''}
            disabled={pending}
            onChange={e => onPenanggungJawab(e.target.value || null)}
            className={`rounded border px-1.5 py-0.5 text-xs disabled:opacity-50 ${
              learner.tutor_penanggung_jawab_id
                ? 'border-slate-200 text-gray-700'
                : 'border-amber-300 bg-amber-50 text-amber-700'
            }`}
          >
            <option value="">— belum ditetapkan —</option>
            {tutors.map(t => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        {learner.access_code ? (
          <code className="rounded bg-slate-100 px-2 py-1 text-sm font-medium tracking-widest">
            {learner.access_code}
          </code>
        ) : (
          <span className="text-xs text-gray-400">kode dicabut</span>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={onReissue}
          className="text-xs text-gray-500 hover:underline disabled:opacity-50"
        >
          {learner.access_code ? 'Ganti' : 'Terbitkan'}
        </button>

        {learner.access_code && (
          <button
            type="button"
            disabled={pending}
            onClick={onRevoke}
            className="text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            Cabut
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            title="Menghapus murid luar beserta riwayat latihannya"
            className="text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  )
}
