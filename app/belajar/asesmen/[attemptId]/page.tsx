import Link from 'next/link'
import { redirect } from 'next/navigation'
import { jawabanTersimpan, soalAsesmen } from '@/lib/belajar/asesmen'
import PelariAsesmen from '@/components/belajar/PelariAsesmen'
import PulangKe from '@/components/belajar/PulangKe'

/**
 * Satu asesmen sesi yang sedang dikerjakan.
 *
 * Penjaganya `soal_asesmen_anak()`: daftar kosong berarti attempt itu bukan
 * milik anak dari akun ini ATAU sudah dikirim, dan keduanya berakhir sama —
 * kembali ke daftar. Membedakannya di layar berarti memberi tahu orang asing
 * bahwa sebuah id attempt itu nyata.
 */
export default async function KerjakanAsesmen({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>
  searchParams: Promise<{ anak?: string }>
}) {
  const { attemptId } = await params
  const { anak } = await searchParams
  const kembali = anak ? `/belajar?anak=${anak}` : '/belajar'

  const [soal, tersimpan] = await Promise.all([soalAsesmen(attemptId), jawabanTersimpan(attemptId)])
  if (soal.length === 0) redirect(kembali)

  return (
    <div className="space-y-4">
      <PulangKe href={kembali} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">Asesmen kelas</p>
        <Link href={kembali} className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-900">
          Keluar
        </Link>
      </div>
      <PelariAsesmen attemptId={attemptId} soal={soal} tersimpan={tersimpan} anak={anak} />
    </div>
  )
}
