import { anakOrRedirect } from '@/lib/keluarga'
import KartuAplikasi, { IKON_MATERI, IKON_MISI, IKON_SORA, IKON_TRYOUT } from '@/components/apps/KartuAplikasi'

/**
 * Beranda siswa bimbel yang masuk dengan kode: empat kartu yang sama dengan beranda siswa langganan
 * (`app/mandiri/page.tsx`), semuanya terbuka. Murid bimbel sudah berhak atas seluruh bank soal,
 * jadi tidak ada kartu yang terkunci.
 */
export default async function BerandaSiswa({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const q = `?anak=${studentId}`

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Halo, {anak.nama_pendek}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pilih yang mau kamu kerjakan hari ini.</p>
      </div>
      <KartuAplikasi nama="Latihan Soal" teks="Latihan soal per topik, dengan pembahasan langsung." href={`/belajar${q}`} warna="bg-blue-50 text-blue-600" ikon={IKON_SORA} />
      <KartuAplikasi nama="Misi" teks="Paket latihan bertingkat per topik, dari dasar sampai Tantangan Akhir." href={`/siswa/${studentId}/misi`} warna="bg-emerald-50 text-emerald-600" ikon={IKON_MISI} />
      <KartuAplikasi nama="Materi" teks="Belajar konsep lewat halaman interaktif, mulai dari bilangan sampai 100." href={`/siswa/${studentId}/materi`} warna="bg-amber-50 text-amber-600" ikon={IKON_MATERI} />
      <KartuAplikasi nama="Try Out" teks="Kerjakan try out TKA dan lihat hasilnya." href={`/siswa/${studentId}/tryout`} warna="bg-violet-50 text-violet-600" ikon={IKON_TRYOUT} />
    </div>
  )
}
