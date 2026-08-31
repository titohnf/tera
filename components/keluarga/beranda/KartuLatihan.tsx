import Link from 'next/link'
import { IkonPanah } from './KartuTagihan'
import CincinPersen from '@/components/belajar/CincinPersen'

/**
 * Kartu sesi latihan yang ditinggalkan di tengah jalan.
 *
 * Satu-satunya pintu menuju sesi yang belum selesai. Undiannya tersimpan sejak
 * migrasi 114, tapi rute sesi tidak ditautkan dari mana pun — tanpa kartu ini,
 * anak yang menutup tab kehilangan sesinya bukan karena datanya hilang
 * melainkan karena tidak ada jalan kembali.
 *
 * Petak kirinya berisi ANGKA PERSEN, bukan ikon. Ikon "play" cuma mengulang apa
 * yang sudah dikatakan judulnya — bahwa ini bisa dilanjutkan — sementara petak
 * itu tempat paling menonjol di kartu. Persen menjawab pertanyaan yang
 * sebenarnya menentukan seseorang melanjutkan sekarang atau nanti: masih jauh,
 * atau tinggal sedikit lagi. Cincinnya menggambar angka yang sama, supaya
 * terbaca sebelum sempat dibaca.
 *
 * Mapel, jenjang, dan topiknya ikut disebut. Sebuah sesi yang ditinggalkan
 * beberapa hari lalu sudah tidak diingat isinya, dan "Lanjutkan latihan" tanpa
 * keterangan menuntut pembacanya membuka sesi itu HANYA untuk tahu ia tentang
 * apa. Ketiganya boleh kosong — sesi Sora lama tidak punya mapel, dan topik yang
 * dihapus dari kurikulum tidak meninggalkan nama; yang hilang cuma barisnya.
 *
 * `?anak=` tidak perlu di tautannya: `/belajar/[sesiId]` tahu sendiri sesi itu
 * milik siapa, dan justru menolak ditanyai dua kali.
 */
export default function KartuLatihan({
  sesiId,
  jumlahSoal,
  sudahDijawab,
  tinggalHasil,
  mapel,
  jenjang,
  topik,
}: {
  sesiId: string
  jumlahSoal: number
  sudahDijawab: number
  tinggalHasil: boolean
  mapel: string | null
  jenjang: string | null
  topik: string | null
}) {
  const persen = jumlahSoal > 0 ? Math.min(100, Math.round((sudahDijawab / jumlahSoal) * 100)) : 0
  const keterangan = [mapel, jenjang, topik].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/belajar/${sesiId}`}
      className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-kartu transition active:bg-slate-50"
    >
      <CincinPersen persen={persen} selesai={tinggalHasil} />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">
          {tinggalHasil ? 'Lihat hasil latihan terakhir' : 'Lanjutkan latihan'}
        </span>

        {keterangan && (
          <span className="mt-0.5 block truncate text-sm text-gray-600">{keterangan}</span>
        )}

        <span className="mt-0.5 block text-xs text-gray-400 tabular-nums">
          {tinggalHasil
            ? `${jumlahSoal} soal terjawab, hasilnya belum dibuka`
            : `${sudahDijawab} dari ${jumlahSoal} soal terjawab`}
        </span>
      </span>

      <IkonPanah />
    </Link>
  )
}
