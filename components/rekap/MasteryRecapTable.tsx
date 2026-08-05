import type { MasteryRecap } from '@/lib/reports/mastery-recap'

/**
 * Matriks murid × topik: satu layar untuk melihat kelas menguasai apa dan
 * tersendat di mana. Ini pengganti rekap "Db Nilai" yang dulu diketik manual di
 * spreadsheet — angkanya datang sendiri dari latihan mandiri.
 *
 * Sengaja tidak memakai skala warna: labelnya berasal dari rubrik yang ditentukan
 * per mapel, jadi jumlah tingkatannya tidak diketahui di muka. Warna dipetakan
 * dari persentase, yang selalu bermakna.
 */
export default function MasteryRecapTable({ recap }: { recap: MasteryRecap }) {
  if (recap.students.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-white p-6 text-sm text-gray-500">
        Belum ada murid aktif di kelas ini.
      </p>
    )
  }

  if (recap.topics.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-white p-6 text-sm text-gray-500">
        <p>Belum ada murid kelas ini yang mengerjakan latihan mandiri.</p>
        {recap.withoutAccess.length > 0 && (
          <p className="mt-2 text-amber-700">
            {recap.withoutAccess.length} murid belum punya kode latihan:{' '}
            {recap.withoutAccess.join(', ')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recap.withoutAccess.length > 0 && (
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Belum punya kode latihan: {recap.withoutAccess.join(', ')}
        </p>
      )}

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-10 bg-white p-3 text-left font-medium text-gray-700">
                Murid
              </th>
              <th className="p-3 text-center font-medium text-gray-700">Keseluruhan</th>
              {recap.topics.map(topic => (
                <th key={topic.groupId} className="min-w-32 p-3 text-left font-medium text-gray-700">
                  <span className="block">{topic.topic}</span>
                  {topic.theme && (
                    <span className="block text-xs font-normal text-gray-400">{topic.theme}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recap.students.map(student => (
              <tr key={student.studentId} className="border-b border-slate-100 last:border-0">
                <td className="sticky left-0 z-10 bg-white p-3 font-medium">{student.name}</td>
                <td className="p-3 text-center">
                  <Cell cell={student.overall} />
                </td>
                {recap.topics.map(topic => (
                  <td key={topic.groupId} className="p-3">
                    <Cell cell={student.cells[topic.groupId] ?? null} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Angka dihitung dari seluruh riwayat latihan mandiri, bukan sesi terakhir saja. Soal yang
        ditandai dua topik dihitung di keduanya.
      </p>
    </div>
  )
}

function Cell({ cell }: { cell: { percent: number; label: string | null; answered: number } | null }) {
  if (!cell) return <span className="text-xs text-gray-300">—</span>

  // Ambang warna sengaja dari persentase, bukan dari label: rubrik bisa punya
  // berapa pun tingkatan, dengan nama apa pun.
  const tone =
    cell.percent >= 85
      ? 'bg-green-50 text-green-800'
      : cell.percent >= 70
        ? 'bg-blue-50 text-blue-800'
        : cell.percent >= 50
          ? 'bg-amber-50 text-amber-800'
          : 'bg-red-50 text-red-800'

  return (
    <span
      title={`${cell.answered} soal dikerjakan`}
      className={`inline-block rounded px-2 py-1 text-xs font-medium ${tone}`}
    >
      {cell.percent}%{cell.label && <span className="ml-1 font-normal">· {cell.label}</span>}
    </span>
  )
}
