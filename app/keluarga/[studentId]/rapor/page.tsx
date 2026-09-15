import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import {
  rangkumanLaporan,
  type RangkumanKelas,
  type RangkumanMandiri,
  type RangkumanKetuntasan,
} from '@/lib/reports/ringkasan-laporan'
import { bulanIni } from '@/lib/waktu'
import { BilahRapor, GrafikNilaiBulanan, MAKS_SERI } from '@/components/keluarga/BilahRapor'

/**
 * Rapor: pintu masuk ketiga laporan seorang anak.
 *
 * Ini yang menggantikan bilah tab. Bilah itu menuntut orang tua MEMILIH sebelum
 * diberi tahu apa pun — tiga nama tanpa isi, lalu tiga daftar panjang yang
 * semuanya menjawab "topik ini bagaimana" sementara yang ditanyakan "anak saya
 * bagaimana". Sekarang jawabannya di layar pertama, dan ketiga laporan jadi
 * kartu yang dibuka kalau memang mau ditelusuri.
 *
 * Rangkuman tiap laporan dipecah PER MAPEL, tidak diringkas jadi satu angka.
 * Satu angka gabungan menuntut penyebut gabungan, dan ketiga laporan ini justru
 * berdiri terpisah karena penyebutnya berlainan.
 *
 * Rutenya `/rapor`, bukan `/laporan`. `/laporan` tetap milik Progres Kelas
 * karena notifikasi laporan bulanan menaut ke sana lengkap dengan `?month=`
 * (lihat `lib/keluarga-notifikasi.ts`) — memindahkannya berarti memutus tautan
 * yang sudah terkirim ke orang tua.
 */
export default async function RaporPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const sekarang = await bulanIni()
  const r = await rangkumanLaporan(studentId, sekarang)

  return (
    // Tanpa kalimat pembuka. Ketiga kartunya berjudul, berketerangan, dan
    // berujung panah — layar ini sudah menerangkan dirinya sendiri, dan sebuah
    // kalimat yang cuma mengatakan "ini rangkuman, ketuk untuk rincian" adalah
    // baris yang dibaca sekali lalu dilewati selamanya.
    <div className="space-y-4">
      {/* Keterangan kartu inilah yang menyebutkan angka-angka di dalamnya
          ANGKA APA. Nama mapel di kepala tiap kolom cuma menjawab "milik
          siapa"; tanpa kalimat ini, "75" adalah bilangan tanpa satuan.
          Ia ditaruh di sini, bukan sebagai label di atas tabel, karena ia
          berlaku untuk SELURUH isi kartu — rata-rata semesteran di tabel
          maupun rata-rata bulanan di grafiknya — dan keterangan adalah tempat
          yang dibaca sebelum angkanya, bukan sesudah. */}
      <KartuLaporan
        judul="Progres Kelas"
        keterangan={`Rata-rata nilai asesmen ${r.semesterLabel}`}
        href={`/keluarga/${studentId}/laporan`}
      >
        {r.kelas === null ? (
          <Kosong>Belum terdaftar di kelas mana pun.</Kosong>
        ) : r.kelas.length === 0 ? (
          <Kosong>Belum ada sesi yang selesai.</Kosong>
        ) : (
          <>
            <TabelMapel kelas={r.kelas} />
            <GrafikKelas kelas={r.kelas} bulan={r.bulanLabel} />
          </>
        )}
      </KartuLaporan>

      <KartuLaporan
        judul="Latihan Mandiri"
        keterangan="Rata-rata nilai latihan per mapel yang dikerjakan secara mandiri dari menu Belajar"
        href={`/keluarga/${studentId}/penguasaan`}
      >
        {/* Mapel yang belum disentuh TIDAK ditampilkan sebagai baris nol.
            "Topik selesai 0% · 0/14" adalah empat angka yang semuanya cuma
            mengatakan satu hal — belum ada apa-apa — dan satu kalimat
            mengatakannya lebih cepat. Begitu ada satu saja yang dikerjakan,
            barisnya kembali. */}
        {r.mandiri === null ? (
          <Kosong>Belum bisa dibaca sekarang.</Kosong>
        ) : r.mandiri.every(m => m.rataRata == null) ? (
          <Kosong>Belum ada latihan mandiri yang dikerjakan.</Kosong>
        ) : (
          r.mandiri
            .filter(m => m.rataRata != null)
            .map(m => <BarisMandiri key={m.mapel} m={m} />)
        )}
      </KartuLaporan>

      <KartuLaporan
        judul="Ketuntasan Materi"
        keterangan="Pengukuran penguasaan mapel Matematika sesuai standar ketuntasan di setiap kelas, dari menu Misi"
        href={`/keluarga/${studentId}/ketuntasan`}
      >
        {/* Tiga keadaan, tiga kalimat berbeda — dan bedanya penting. Tidak
            punya peta bukan salah anaknya, gagal dibaca bukan salah siapa pun,
            dan belum dikerjakan adalah satu-satunya dari ketiganya yang
            memang menunggu anaknya. Menyamakan ketiganya jadi "belum ada
            data" menuduh yang tidak perlu dituduh. */}
        {r.ketuntasan === null ? (
          <Kosong>Belum ada peta kompetensi untuk anak ini.</Kosong>
        ) : r.ketuntasan.dikerjakan === 0 ? (
          <Kosong>Belum ada topik peta kompetensi yang dikerjakan.</Kosong>
        ) : (
          <BarisKetuntasan k={r.ketuntasan} />
        )}
      </KartuLaporan>
    </div>
  )
}

/**
 * Kartu satu laporan: judul, keterangan, rangkuman, lalu pintu.
 *
 * Seluruh kartunya tautan — sasaran sentuh setinggi kartunya sendiri adalah
 * satu-satunya ukuran yang masuk akal di ponsel, dan pola yang sama sudah
 * dipakai `KartuPenguasaan`.
 */
function KartuLaporan({
  judul,
  keterangan,
  href,
  children,
}: {
  judul: string
  keterangan: string
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white p-4 shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-100"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-tight text-gray-900">{judul}</p>
          <p className="mt-0.5 text-xs text-gray-400">{keterangan}</p>
        </div>
        {/* Chevron gambar, bukan karakter "›". Karakternya digambar setipis
            tanda kutip pada ukuran teks biasa dan berwarna gray-300 nyaris
            lenyap di alas putih — kartunya jadi tidak terbaca sebagai sesuatu
            yang bisa diketuk. Goresan 2px pada 18px terbaca dari jarak baca
            ponsel, dan gray-400 cukup gelap untuk terlihat tanpa bersaing
            dengan judulnya. */}
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">{children}</div>
    </Link>
  )
}

function Kosong({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400">{children}</p>
}

/**
 * Rata-rata tiap mapel sebagai tabel: nama di atas, angkanya di bawah.
 *
 * Berkolom, bukan berbaris. Yang dilakukan mata di sini membandingkan angka
 * antar mapel, dan angka yang berdiri berdampingan pada garis dasar yang sama
 * bisa dibandingkan sekali lihat — sementara daftar berbaris menuntut mata
 * melompat turun dan menahan angka pertama dalam ingatan.
 *
 * Pemisahnya garis tegak setipis rambut, bukan kotak: yang perlu ditandai cuma
 * "kolom ini berhenti di sini". Kolom terakhir tidak berpemisah, jadi tabelnya
 * tidak tampak terpotong di tepi kartunya.
 *
 * Kehadiran tidak ada di sini. Kartu ini pintu, bukan laporan — dan kehadiran
 * adalah angka yang dibuka orang tua saat mereka memang sedang
 * mempertanyakannya, bukan yang dicari sambil lewat. Ia menunggu satu ketukan
 * lebih dalam, di halaman yang kartunya tuju.
 */
function TabelMapel({ kelas }: { kelas: RangkumanKelas[] }) {
  return (
    <div className="flex divide-x divide-slate-100">
      {kelas.map(m => (
        <div key={m.mapel} className="min-w-0 flex-1 px-3 first:pl-0 last:pr-0">
          <p className="truncate text-xs text-gray-400">{m.mapel}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
            {/* Em dash, bukan nol: mapel yang belum pernah diasesmen tidak
                bernilai nol, ia belum punya nilai sama sekali. */}
            {m.rataRata ?? '—'}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Grafik nilai enam bulan untuk seluruh mapel, satu bidang.
 *
 * Mapel yang belum punya satu pun asesmen di jendela ini TIDAK ikut jadi garis:
 * seri yang seluruh titiknya kosong cuma menambah satu baris legenda yang tidak
 * menunjuk apa-apa. Angkanya tetap terbaca di daftar teks di atas.
 *
 * Dipotong di `MAKS_SERI` garis, dan yang bertahan adalah mapel dengan sesi
 * terbanyak. Batas itu bukan selera ruang melainkan batas paletnya — lihat
 * catatan di `BilahRapor`. Yang tidak masuk disebutkan, bukan dihilangkan
 * diam-diam: daftar yang lebih panjang daripada grafiknya harus punya
 * penjelasan di layar yang sama.
 */
function GrafikKelas({ kelas, bulan }: { kelas: RangkumanKelas[]; bulan: string[] }) {
  const bergrafik = kelas.filter(m => m.nilaiBulanan.some(v => v != null))
  if (bergrafik.length === 0) return null

  const tampil = bergrafik.slice(0, MAKS_SERI)
  const sisa = bergrafik.length - tampil.length

  return (
    // Bergaris pemisah dari tabel di atasnya: keduanya membaca periode yang
    // sama tapi menjawab hal yang berbeda — tabel "seberapa bagus semester
    // ini", grafik "bergerak ke mana". Tanpa garis, angka besar di tabel dan
    // sumbu grafik terbaca sebagai satu blok yang sama.
    <div className="mt-3 border-t border-slate-100 pt-3">
      <GrafikNilaiBulanan
        seri={tampil.map(m => ({ mapel: m.mapel, nilai: m.nilaiBulanan }))}
        bulan={bulan}
      />
      {sisa > 0 && (
        <p className="mt-1 text-xs text-gray-400">
          Grafik menampilkan {MAKS_SERI} mapel dengan sesi terbanyak; {sisa} mapel lain
          tidak digambar.
        </p>
      )}
    </div>
  )
}

/**
 * Satu mapel di kartu Latihan Mandiri: cakupannya persentase, skornya berbilah.
 *
 * Tidak ada grafik bulanan di sini, dan itu bukan kelalaian: penguasaan topik
 * adalah keadaan SEKARANG, bukan deret peristiwa bertanggal. Mengulang sebuah
 * topik menimpa nilainya alih-alih menambah titik baru (migrasi 128), jadi
 * tidak ada sumbu waktu yang bisa digambar tanpa mengarangnya.
 */
function BarisMandiri({ m }: { m: RangkumanMandiri }) {
  return (
    <div className="space-y-1 pt-1">
      <p className="text-sm font-semibold tracking-tight text-gray-900">{m.mapel}</p>
      <p className="text-xs text-gray-400">
        Topik selesai {m.topik > 0 ? Math.round((m.selesai / m.topik) * 100) : 0}% · {m.selesai}/
        {m.topik} topik
      </p>
      {m.rataRata != null && (
        <BilahRapor nama="Skor" nilai={m.rataRata} teks={String(m.rataRata)} />
      )}
    </div>
  )
}

function BarisKetuntasan({ k }: { k: RangkumanKetuntasan }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-gray-600">
        {k.levelKelas ? (
          <>
            Kemampuan {k.mapel} siswa saat ini berada di{' '}
            <span className="font-semibold text-gray-900">level kelas {k.levelKelas}</span>.
          </>
        ) : (
          // Belum ada satu jenjang pun yang penuh. Dikatakan begitu, bukan
          // dibulatkan ke bawah jadi "level kelas 7" yang belum dimiliki
          // anaknya — kalimat inilah yang akan dikutip orang tua.
          <>Belum ada jenjang yang seluruh topiknya tuntas.</>
        )}
      </p>
      {/* Tangga jenjang, dari kelas terendah ke atas. Ia yang membuat kalimat
          di atasnya bisa DIPERIKSA alih-alih dipercaya: pembacanya melihat
          sendiri jenjang mana yang penuh dan mana yang baru separuh, dan
          "berada di level kelas 7" berhenti jadi klaim yang datang entah dari
          mana.

          Satu warna saja — biru, arti yang sama dengan kedua kartu di atas:
          seberapa banyak yang selesai. Tidak ada legenda, karena satu seri
          tidak perlu diterangkan warnanya. */}
      <div className="space-y-0.5 pt-1">
        {k.jenjang.map(j => (
          <BilahRapor
            key={j.label}
            nama={`Kelas ${j.label}`}
            nilai={j.topik > 0 ? (j.tuntas / j.topik) * 100 : 0}
            teks={`${j.tuntas}/${j.topik}`}
          />
        ))}
      </div>
      {/* Penyebut baris-baris di atas berjumlah persis sebanyak topiknya, jadi
          tidak ada selisih yang perlu dibela. Yang tetap disebut cuma aturan
          penempatannya: tanpa itu, orang tua yang tahu anaknya mengerjakan
          topik "kelas 7-8" akan mencarinya di baris kelas 7 dan tidak
          menemukannya. */}
      <p className="pt-1 text-xs text-gray-400">
        {k.tuntas} dari {k.topik} topik tuntas. Topik yang membentang dua kelas
        dihitung di kelas atasnya.
      </p>
    </>
  )
}
