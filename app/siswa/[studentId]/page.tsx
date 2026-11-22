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
        <p className="text-sm text-gray-500 mt-0.5">Mau belajar apa hari ini?</p>
      </div>
      <KartuAplikasi nama="Latihan Soal" teks="Berlatih soal per topik, lengkap dengan pembahasannya." href={`/belajar${q}`} warna="bg-blue-50 text-blue-600" ikon={IKON_SORA} />
      <KartuAplikasi nama="Misi" teks="Naik level topik demi topik dan kumpulkan bintangnya." href={`/siswa/${studentId}/misi`} warna="bg-emerald-50 text-emerald-600" ikon={IKON_MISI} />
      <KartuAplikasi nama="Materi" teks="Pelajari konsep lewat halaman interaktif yang seru." href={`/siswa/${studentId}/materi`} warna="bg-amber-50 text-amber-600" ikon={IKON_MATERI} />
      <KartuAplikasi nama="Try Out" teks="Uji kemampuanmu dengan try out TKA dan lihat hasilnya." href={`/siswa/${studentId}/tryout`} warna="bg-violet-50 text-violet-600" ikon={IKON_TRYOUT} />
    </div>
  )
}
