import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  labelPenguasaan,
  pemilikSesi,
  ringkasanSesi,
  rubrikMapel,
  tutupSesi,
  type PitaPenguasaan,
} from '@/lib/belajar/sesi'
import { persenDari } from '@/lib/belajar/penilaian'
import { createClient } from '@/lib/supabase/server'

/**
 * Hasil satu sesi, dirinci per topik.
 *
 * Soal yang bertag dua topik dihitung di keduanya — itu memang tujuannya.
 * Pertanyaan yang dijawab halaman ini adalah "sejauh apa penguasaan topik ini",
 * bukan "apakah angkanya berjumlah seratus persen".
 *
 * Labelnya (mis. "Mahir", "Cakap") datang dari rubrik mapel di database, bukan
 * dari daftar yang ditulis di sini. Mapel tanpa rubrik menampilkan persentase
 * mentah — tanpa label lebih jujur daripada label yang dikarang halaman ini.
 */
export default async function HasilSesi({
  params,
}: {
  params: Promise<{ sesiId: string }>
}) {
  const { sesiId } = await params

  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  // Halaman inilah tanda sesi itu selesai, jadi di sinilah ia ditutup — bukan
  // di tombol yang membawa orang ke sini. Sebuah tombol bisa tidak tertekan
  // (dan memang pernah tidak: sesi pertama di produksi berakhir dengan
  // `finished_at` null), sementara halaman ini pasti dilewati siapa pun yang
  // sampai di akhir. `practice_finish_session` memakai `coalesce`, jadi membuka
  // halaman ini dua kali tidak memundurkan waktu selesainya.
  await tutupSesi(sesiId)

  const rincian = await ringkasanSesi(pemilik.learnerId, sesiId)

  // Rubriknya milik mapel sesi ini. Dibaca lewat sesinya, bukan diterima dari
  // alamat, supaya halaman ini tidak bisa dipakai mengintip rubrik mapel lain.
  const supabase = await createClient()
  const { data: sesi } = await supabase
    .from('practice_sessions')
    .select('subject_id')
    .eq('id', sesiId)
    .single()
  const rubrik: PitaPenguasaan[] | null = sesi?.subject_id
    ? await rubrikMapel(sesi.subject_id as string)
    : null

  const total = rincian.reduce((s, b) => s + Number(b.score), 0)
  const maksimum = rincian.reduce((s, b) => s + Number(b.max_score), 0)
  const persen = persenDari(total, maksimum)
  const label = labelPenguasaan(rubrik, persen)

  const kembali = pemilik.profileId ? `/belajar?anak=${pemilik.profileId}` : '/belajar'

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 text-center shadow ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500">Hasil latihan {pemilik.nama}</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900">{persen}%</p>
        {label && <p className="mt-0.5 text-sm font-semibold text-blue-600">{label}</p>}
      </div>

      {rincian.length === 0 ? (
        <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
          <p className="text-sm leading-relaxed text-gray-500">
            Tidak ada rincian topik untuk sesi ini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow ring-1 ring-gray-900/5">
          {rincian.map(baris => {
            const p = persenDari(Number(baris.score), Number(baris.max_score))
            const l = labelPenguasaan(rubrik, p)
            return (
              <div key={baris.group_id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{baris.topic}</p>
                  {baris.theme && <p className="text-xs text-gray-400">{baris.theme}</p>}
                  <p className="text-xs text-gray-400">{baris.answered} soal</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">{p}%</p>
                  {l && <p className="text-xs text-gray-500">{l}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link
        href={kembali}
        className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Latihan Lagi
      </Link>
    </div>
  )
}
