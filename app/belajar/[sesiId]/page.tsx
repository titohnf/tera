import Link from 'next/link'
import { redirect } from 'next/navigation'
import { batasWaktuSesi, keadaanSesi, paketSesi, pemilikSesi } from '@/lib/belajar/sesi'
import { paketTopikSesi } from '@/lib/belajar/topik-peta'
import { namaPaket } from '@/lib/belajar/nama-paket'
import PelariSesi from '@/components/belajar/PelariSesi'

/**
 * Satu sesi latihan, dengan alamatnya sendiri.
 *
 * Rute ini TIDAK memanggil `belajarContext()`, dan itu bukan kelalaian: konteks
 * itu menjawab "atas nama siapa" dari `?anak=`, sementara sebuah sesi sudah tahu
 * miliknya siapa. Menanyakannya dua kali berarti membuka kemungkinan dua
 * jawaban yang berbeda — tautan yang disalin-tempel menyandingkan id sesi
 * seorang anak dengan id anak lain, dan halamannya harus mengurus perselisihan
 * yang seharusnya tidak pernah ada.
 *
 * Penjaganya `practice_session_owner()`, yang memakai gerbang yang sama persis
 * dengan seluruh RPC `practice_*`: null berarti sesi itu bukan milik pemanggil
 * ATAU tidak ada, dan keduanya berakhir sama. Membedakannya di layar berarti
 * memberi tahu orang asing bahwa sebuah id sesi itu nyata.
 */
export default async function SesiLatihan({
  params,
}: {
  params: Promise<{ sesiId: string }>
}) {
  const { sesiId } = await params

  const pemilik = await pemilikSesi(sesiId)
  if (!pemilik) redirect('/belajar')

  // `profile_id` seorang pelajar keluarga adalah id profil ANAKNYA — persis
  // yang dibutuhkan `?anak=` untuk kembali ke daftar mapel atas nama yang sama.
  // Untuk pelanggan langganan ia id dirinya sendiri, dan `belajarContext()`
  // memang mengabaikan `?anak=` untuk role `mandiri`, jadi satu bentuk tautan
  // cukup untuk keduanya.
  const kembali = pemilik.profileId ? `/belajar?anak=${pemilik.profileId}` : '/belajar'

  const [soal, paket, petaPaket, batasWaktu] = await Promise.all([
    keadaanSesi(sesiId),
    paketSesi(sesiId),
    paketTopikSesi(sesiId),
    batasWaktuSesi(sesiId),
  ])
  if (soal.length === 0) redirect('/belajar')

  // Semua soal sudah terjawab — yang tersisa memang halaman hasilnya. Ini jalur
  // yang dilewati orang yang menutup tab tepat sesudah soal terakhir.
  if (soal.every(s => s.sudahDijawab)) redirect(`/belajar/${sesiId}/hasil`)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {/* Nama paketnya, bukan cuma "Latihan": sepuluh soal ini satu satuan
            penilaian yang berdiri sendiri, dan anak yang tahu ia sedang
            mengerjakan Paket 3 tahu pula bahwa Paket 1 dan 2 sudah punya
            nilainya masing-masing yang tidak akan terhapus. */}
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">
            {paket ? `Paket ${paket.nomor}` : petaPaket ? namaPaket(petaPaket) : 'Latihan'}
          </span>{' '}
          · {pemilik.nama}
        </p>
        <Link
          href={kembali}
          className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Keluar
        </Link>
      </div>

      <PelariSesi sesiId={sesiId} soal={soal} batasWaktu={batasWaktu} />
    </div>
  )
}
