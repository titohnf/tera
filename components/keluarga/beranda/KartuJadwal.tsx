import Link from 'next/link'
import { labelSesiWib } from '@/lib/waktu'

/**
 * Kartu utama beranda keluarga: kapan les berikutnya.
 *
 * Ia sengaja dibuat paling menonjol di halaman — satu-satunya kartu berwarna
 * penuh, bersudut lebih besar, berbayang lebih dalam. Warnanya biru tua
 * `#1e3a8a` — sengaja BUKAN biru merek `#026bf5` yang dipakai ikon pintasan
 * tepat di bawahnya. Dua biru yang berdekatan tapi tak sama persis saling
 * meredam: yang satu terbaca seperti versi pudar dari yang lain, dan barisan
 * itu jadi mati. Biru tua ini cukup jauh nadanya untuk berdiri sebagai warna
 * tersendiri, sekaligus jadi alas gelap yang membuat ikon-ikon biru cerah di
 * bawahnya justru lebih menyala.
 *
 * Teks putihnya 10.4:1 terhadap latar itu, dan dua nada biru muda untuk label
 * dan rincian (`#bcc4dc`, `#d2d8e8`) ada di 5.9:1 dan 7.3:1 — semuanya lewat
 * ambang AA. Ini yang menggugurkan tosca logo `#20c5b5` sebagai warna kartu:
 * di nada aslinya ia cuma 2.2:1 terhadap putih.
 *
 * Sebelumnya seluruh isi beranda memakai bentuk yang sama persis (kotak putih, `p-4`, cincin abu),
 * sehingga tidak ada yang memimpin: mata harus membaca kelimanya untuk tahu
 * mana yang penting. Pertanyaan yang membuat orang tua membuka portal ini
 * hampir selalu "kapan les berikutnya", jadi itulah yang pantas dilihat lebih
 * dulu dari yang lain.
 *
 * Waktunya disebut sebagaimana orang menyebutnya — "Besok, 16.00" — dengan
 * tanggal lengkap sebagai baris kedua supaya tetap bisa dicocokkan dengan
 * kalender. Lihat `labelSesiWib`, yang juga menutup satu kekeliruan lama: kartu
 * ini dulu memformat jam TANPA zona waktu, padahal server berjalan di UTC.
 *
 * Tanpa sesi terjadwal, kartunya tidak berwarna. Layar kosong yang tetap meriah
 * membuat ketiadaan jadwal tampak seperti keadaan biasa, padahal itu justru hal
 * yang perlu ditanyakan orang tua ke admin.
 */
export default function KartuJadwal({
  studentId,
  namaAnak,
  sesi,
  hariIniWib,
}: {
  studentId: string
  namaAnak: string
  sesi: { scheduled_at: string; mapel: string | null; topik: string | null; tutor: string | null } | null
  hariIniWib: string
}) {
  const href = `/keluarga/${studentId}/jadwal`

  if (!sesi) {
    return (
      <Link
        href={href}
        className="block rounded-2xl bg-white p-5 shadow-kartu transition active:bg-slate-50"
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <IkonKalender />
          Jadwal berikutnya
        </p>
        <p className="mt-2 text-base font-medium text-gray-400">
          Belum ada sesi terjadwal untuk {namaAnak}.
        </p>
      </Link>
    )
  }

  const { hari, jam, tanggal, hariIni } = labelSesiWib(sesi.scheduled_at, hariIniWib)
  const rincian = [sesi.mapel, sesi.topik, sesi.tutor && `bersama ${sesi.tutor}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={href}
      /* Satu warna rata, bukan gradien. Gradien menambahkan gerak yang tidak
         berarti apa-apa — tidak ada dua sisi kartu ini yang berbeda nilainya —
         dan pada bidang selebar layar ponsel ia berakhir sebagai dua warna biru
         yang tampak seperti kekeliruan cetak. Warnanya sendiri yang
         memisahkannya dari latar putih, jadi bayang pun tidak perlu. Yang
         memecah bidangnya justru ornamen sudut di bawah ini. */
      className="relative block overflow-hidden rounded-2xl bg-[#1e3a8a] p-5 transition active:bg-[#172e6e]"
    >
      {/* Ornamen sudut kanan atas: sorotan tosca yang meluruh, dengan kisi titik
          halus di dalamnya. Bidang biru selebar layar tanpa apa pun terbaca datar
          seperti kotak placeholder; keduanya memberi kedalaman tanpa menambah
          satu pun hal yang harus dibaca.

          Sorotannya sendiri terlalu halus untuk berdiri sendirian — di layar
          ponsel yang terang ia nyaris tak terlihat. Titik-titiknya yang memberi
          tekstur yang bisa dipegang mata; sorotannya yang memberi titik-titik itu
          arah, dari pekat di sudut ke hilang di tengah kartu.

          Sudut kanan atas dipilih karena paling sepi: cuma lencana "Hari ini"
          yang sesekali muncul di sana, dan ia berlatar `bg-white/20` sendiri.
          Kadar alfanya ditahan rendah — putih di atas titik paling terang pun
          masih di atas ambang untuk teks besar, dan tidak ada teks kecil yang
          melewati daerah itu.

          Topengnya ditulis dua kali, `WebkitMaskImage` dan `maskImage`: Safari
          iOS — peramban sebagian besar orang tua di sini — masih menuntut yang
          berawalan, dan tanpanya kisi titiknya muncul sebagai persegi tegas.

          `aria-hidden` dan `pointer-events-none`: ini ornamen, bukan isi, dan ia
          tidak boleh mencuri ketukan yang ditujukan ke kartunya. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 100% 0%, rgba(32,197,181,0.22), rgba(255,255,255,0.05) 38%, transparent 68%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-32 w-48"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          WebkitMaskImage: 'linear-gradient(to bottom left, #000, transparent 70%)',
          maskImage: 'linear-gradient(to bottom left, #000, transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#bcc4dc]">
          <IkonKalender />
          Jadwal berikutnya
        </p>
        {/* Penanda "hari ini" berdiri terpisah dari tulisan waktunya. Tanggal
            yang berbunyi "Hari ini" mudah terbaca sepintas sebagai tanggal
            biasa; lencana kecil yang kontras tidak bisa dilewatkan. */}
        {hariIni && (
          <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
            Hari ini
          </span>
        )}
      </div>

      <p className="relative mt-3 text-2xl font-bold leading-tight text-white">
        {hari}
        <span className="text-white/60"> · </span>
        {jam}
      </p>
      {/* Tanggal lengkapnya diulang hanya kalau baris di atas TIDAK menyebutnya
          — kalau tidak, dua baris beruntun berbunyi sama. */}
      {hari !== tanggal && <p className="relative mt-0.5 text-sm text-[#bcc4dc]">{tanggal}</p>}

      {rincian && (
        <p className="relative mt-3 border-t border-white/15 pt-3 text-sm text-[#d2d8e8]">{rincian}</p>
      )}
    </Link>
  )
}

function IkonKalender() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}
