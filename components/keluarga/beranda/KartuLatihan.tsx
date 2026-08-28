import Link from 'next/link'
import { IkonPanah } from './KartuTagihan'

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

/**
 * Cincin kemajuan berisi angka persennya.
 *
 * Digambar dengan `stroke-dasharray` pada satu lingkaran, bukan dengan dua
 * bingkai bertumpuk: kelilingnya dihitung sekali (2πr), lalu panjang goresnya
 * tinggal sekian persen darinya. Goresnya 6 satuan, bukan 4: cincin setipis 4
 * terbaca seperti garis pinggir, bukan seperti takaran yang sedang terisi.
 * Jari-jarinya turun ke 19 supaya tepi luarnya (19 + 6/2 = 22) tetap punya sisa
 * di dalam kotak 48 — gores yang menyentuh tepi akan terpotong begitu kartunya
 * dirender di layar dengan pembulatan piksel yang berbeda.
 *
 * Petaknya 56px, naik dari 48px, sementara `viewBox`-nya tetap 48: semua ukuran
 * di dalam ikut membesar seperlima tanpa satu angka pun di sini berubah. Itu
 * sebabnya cincin ini digambar dalam satuan viewBox, bukan piksel — mengubah
 * besarnya cukup di satu tempat, di kelas petaknya. Diputar -90 derajat supaya nolnya mulai dari
 * atas, bukan dari kanan — kemajuan yang dibaca searah jarum jam mulai dari jam
 * 12 adalah satu-satunya bentuk yang tidak perlu dijelaskan.
 *
 * Cincin yang sedang berjalan bergores tosca `#1a9e91` — tosca merek `#20c5b5`
 * yang ditua-kan 20%, karena nada aslinya cuma 2.2:1 terhadap putih dan gores
 * setipis 4px hilang di layar terang. Angkanya sendiri lebih tua lagi
 * (`#13766d`, 5.5:1), sebab teks 11px menuntut ambang yang lebih tinggi
 * daripada bentuk.
 *
 * Toscanya juga memisahkan kartu ini dari petak pintasan yang serba biru di
 * bawahnya: cincin biru di antara ikon-ikon biru terbaca sebagai salah satu
 * dari mereka, bukan sebagai kemajuan yang sedang berjalan.
 *
 * Yang sudah selesai tetap hijau. Itu bukan warna merek dan memang tidak perlu:
 * hijau di sini mengatakan "beres", bukan "ini Tera".
 */
function CincinPersen({ persen, selesai }: { persen: number; selesai: boolean }) {
  const r = 19
  const keliling = 2 * Math.PI * r

  return (
    <span className="relative grid h-14 w-14 shrink-0 place-items-center">
      <svg className="absolute inset-0 h-14 w-14 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="6" className="stroke-slate-100" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={selesai ? 'stroke-emerald-500' : 'stroke-[#1a9e91]'}
          strokeDasharray={`${(keliling * persen) / 100} ${keliling}`}
        />
      </svg>
      <span
        className={`relative text-xs font-bold tabular-nums ${
          selesai ? 'text-emerald-600' : 'text-[#13766d]'
        }`}
      >
        {persen}%
      </span>
    </span>
  )
}
