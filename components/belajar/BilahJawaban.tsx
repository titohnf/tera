import Link from 'next/link'
import { rincianJawaban, type RincianJawaban } from '@/lib/belajar/penguasaan'

/**
 * Warna tiap hasil, dipakai bersama oleh bilah dan keterangannya. Satu daftar,
 * bukan dua: warna di bilah yang tidak cocok dengan titik di keterangannya
 * adalah legenda yang berbohong, dan itu lebih buruk daripada tanpa legenda.
 */
const WARNA = {
  benar: 'bg-emerald-500',
  sebagian: 'bg-amber-400',
  salah: 'bg-rose-300',
  belum: 'bg-gray-200',
} as const

/**
 * Bilah jawaban sebuah topik: satu bilah yang menjawab dua hal sekaligus.
 *
 * PANJANG TERISINYA cakupan — berapa soal dari berapa yang sudah dikerjakan,
 * satu-satunya angka di layar ini yang benar-benar berbentuk "sekian dari
 * sekian". WARNANYA hasilnya: benar, sebagian, salah. Sebelumnya bilahnya
 * sewarna dan cuma bercerita soal cakupan, sehingga anak yang mengerjakan
 * sepuluh soal dan salah semua terlihat sama persis dengan yang benar semua.
 *
 * Sisanya dibiarkan jadi alas abu-abu, bukan diberi warna sendiri: yang belum
 * dikerjakan bukan hasil, dan mewarnainya membuat "belum" tampil sederajat
 * dengan "salah".
 *
 * Komponen biasa tanpa keadaan, jadi ia bisa dipakai halaman server (Penguasaan)
 * maupun dari dalam komponen browser (`PemilihLatihan`) — dua permukaan yang
 * memang harus menggambar hal yang sama dengan cara yang sama.
 */
export default function BilahJawaban({
  rincian,
  total,
  className = '',
}: {
  rincian: RincianJawaban
  /** Seluruh soal di topik itu; nol berarti tidak ada yang bisa digambar. */
  total: number
  className?: string
}) {
  if (total <= 0) return null
  const lebar = (n: number) => `${(n / total) * 100}%`
  return (
    <span
      className={`flex h-1.5 overflow-hidden rounded-full bg-gray-100 ${className}`}
      role="img"
      aria-label={rincianJawaban(rincian)}
    >
      <span className={`block h-full ${WARNA.benar}`} style={{ width: lebar(rincian.correct) }} />
      <span className={`block h-full ${WARNA.sebagian}`} style={{ width: lebar(rincian.partial) }} />
      <span className={`block h-full ${WARNA.salah}`} style={{ width: lebar(rincian.wrong) }} />
    </span>
  )
}

/**
 * Keterangan bilah: titik berwarna, angkanya, lalu namanya.
 *
 * Ditulis sebagai kata, bukan sebagai legenda terpisah di kepala halaman:
 * "2 benar · 9 salah" yang berdiri di kartunya sendiri tidak menuntut siapa pun
 * mengingat arti sebuah warna sambil menggulung.
 *
 * Ukurannya `text-sm`, bukan `text-xs` seperti keterangan lain di sekitarnya.
 * Ini kalimat yang paling dicari orang tua di layar ini — berapa yang benar —
 * dan mencetaknya sekecil catatan kaki berarti menyembunyikannya di tempat
 * yang paling terang.
 *
 * "Benar" selalu ada meski nol; sisanya hanya kalau ada. Alasannya ditulis di
 * `rincianJawaban()`, yang juga jadi label bagi pembaca layar.
 */
export function KeteranganJawaban({
  rincian,
  className = '',
}: {
  rincian: RincianJawaban
  className?: string
}) {
  const bagian = [
    { kunci: 'benar', warna: WARNA.benar, nama: 'benar', n: rincian.correct, selalu: true },
    { kunci: 'sebagian', warna: WARNA.sebagian, nama: 'sebagian benar', n: rincian.partial },
    { kunci: 'salah', warna: WARNA.salah, nama: 'salah', n: rincian.wrong },
    { kunci: 'belum', warna: WARNA.belum, nama: 'belum dikerjakan', n: rincian.belum },
  ].filter(b => b.selalu || b.n > 0)

  // `span`, bukan `ul`/`li`: komponen ini dipakai di dalam baris topik yang
  // seluruhnya terbuat dari `span` (sebuah `button` hanya boleh memuat isi
  // sebaris), dan daftar di dalam span adalah susunan yang tidak sah. Perannya
  // tetap disebut lewat `role`, jadi pembaca layar tetap mendengarnya sebagai
  // daftar.
  return (
    <span role="list" className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      {bagian.map(b => (
        <span
          key={b.kunci}
          role="listitem"
          className="flex items-center gap-1.5 text-sm text-gray-500"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${b.warna}`} aria-hidden />
          <span className="font-semibold tabular-nums text-gray-900">{b.n}</span>
          {b.nama}
        </span>
      ))}
    </span>
  )
}

/** Hasil satu soal, sebagaimana digambar sebuah petak bernomor. */
export type HasilSoal = 'benar' | 'sebagian' | 'salah' | 'belum'

/**
 * Nilai sebuah soal diterjemahkan jadi salah satu dari empat keadaan itu.
 *
 * Satu fungsi, bukan satu rantai ternari di tiap pemanggil: halaman hasil dan
 * rincian topik menggambar petak yang sama untuk soal yang sama, dan dua
 * rantai ternari yang disalin pasti akan berbeda pada suatu hari — kemungkinan
 * besar di soal bernilai sebagian, satu-satunya yang batasnya tidak jelas.
 *
 * `max <= 0` masuk "salah", sejalan dengan migrasi 130: soal berbobot nol yang
 * dijawab nol akan lolos sebagai "benar" pada perbandingan `skor >= maks`, dan
 * itu kabar bohong yang paling mudah lewat tanpa terbaca.
 */
export function hasilSoal(
  skor: number | null,
  maks: number | null,
  sudahDijawab: boolean
): HasilSoal {
  if (!sudahDijawab) return 'belum'
  const s = skor ?? 0
  const m = maks ?? 0
  return m > 0 && s >= m ? 'benar' : s > 0 ? 'sebagian' : 'salah'
}

/**
 * Warna tulisan di atas tiap warna petak. Dipisah dari `WARNA` karena yang
 * dijaga di sini bukan artinya melainkan keterbacaannya: `bg-rose-300` yang
 * bagus sebagai titik legenda tidak bisa memikul tulisan putih.
 */
const TEKS: Record<HasilSoal, string> = {
  benar: 'text-white',
  sebagian: 'text-amber-950',
  salah: 'text-rose-900',
  belum: 'text-gray-600',
}

const NAMA: Record<HasilSoal, string> = {
  benar: 'benar',
  sebagian: 'sebagian benar',
  salah: 'salah',
  belum: 'belum dijawab',
}

/**
 * Satu petak bernomor. Berdiri sendiri karena dipakai dua-duanya: berderet di
 * rincian topik, dan satuan sebagai penanda tiap soal di halaman hasil — dan
 * dua permukaan yang menomori soal yang sama harus menomorinya dengan rupa yang
 * sama, kalau tidak keduanya tidak akan terbaca sebagai nomor yang sama.
 *
 * Ukurannya 32 piksel, bukan seukuran teksnya: begitu petaknya bisa diketuk, ia
 * jadi sasaran ketuk di ponsel milik anak SD, dan petak 24 piksel berjejer
 * rapat adalah nomor yang salah terbuka. Ukurannya SATU untuk yang bisa
 * diketuk maupun tidak — deretan petak yang tingginya berbeda-beda dalam satu
 * daftar terbaca sebagai dua jenis benda, padahal keduanya nomor soal.
 */
export function PetakNomor({
  nomor,
  hasil,
  href,
  aktif,
  penuh,
}: {
  nomor: number
  hasil: HasilSoal
  /** Kalau ada, petaknya jadi tautan ke soal itu di halaman hasil. */
  href?: string | null
  /** Soal yang sedang dibuka: bercincin, dan tidak menaut ke dirinya sendiri. */
  aktif?: boolean
  /**
   * Melebar mengisi kolom kisi alih-alih persegi 32px — untuk deretan yang
   * memang dimaksudkan memenuhi lebar kartunya. Sedikit lebih tinggi pula:
   * petak selebar 60px yang tingginya tetap 32px terbaca sebagai bilah, bukan
   * sebagai satu dari sepuluh hal yang setara.
   */
  penuh?: boolean
}) {
  const kelas = `flex ${penuh ? 'h-9 w-full' : 'h-8 w-8'} shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums ${WARNA[hasil]} ${TEKS[hasil]} ${aktif ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`
  const nama = `Soal ${nomor} ${NAMA[hasil]}`
  return href && !aktif ? (
    <Link href={href} aria-label={`${nama}, buka pembahasannya`} className={`${kelas} transition hover:brightness-95 active:brightness-90`}>
      {nomor}
    </Link>
  ) : (
    <span aria-label={nama} aria-current={aktif ? 'true' : undefined} className={kelas}>
      {nomor}
    </span>
  )
}

/**
 * Titik hasil: bulat, kecil, tanpa angka — untuk dijejer sekolom antar-putaran.
 *
 * Bukan petak yang dikecilkan melainkan bentuk yang berbeda, dan bedanya
 * disengaja. Petak bernomor di atasnya adalah DAFTAR yang dibaca satu per satu
 * dan diketuk; deretan ini POLA yang dilihat sekaligus. Titik bulat tidak
 * menuntut dibaca, jadi empat putaran bisa dibandingkan dalam satu pandangan —
 * yang dicari mata di sini cuma "kolom mana yang berubah hijau, dan di baris
 * ke berapa".
 *
 * Bulat, dan besarnya mengikuti kolom kisi pemanggilnya (`w-full` +
 * `aspect-square`) sampai batas yang dipatok di sana. Nomornya ikut karena
 * ruangnya cukup: deretan ini memang pola yang dilihat sekaligus, tapi begitu
 * sebuah titik menarik perhatian pertanyaan berikutnya selalu "itu soal nomor
 * berapa" — dan tanpa angka, jawabannya harus dihitung dari kiri.
 */
export function TitikHasil({ nomor, hasil }: { nomor: number; hasil: HasilSoal }) {
  return (
    <span
      aria-hidden
      className={`flex aspect-square w-full items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ${WARNA[hasil]} ${TEKS[hasil]}`}
    >
      {nomor}
    </span>
  )
}

/**
 * Nomor-nomor soal sebuah pengerjaan, diwarnai menurut hasilnya.
 *
 * "3 dari 10 soal benar" mengatakan berapa, tidak pernah mengatakan yang mana —
 * dan yang mana itulah satu-satunya bentuk yang bisa ditindaklanjuti: orang tua
 * yang tahu soal 4, 7, dan 9 salah bisa membuka pembahasan ketiganya, sementara
 * "3 dari 10" cuma bisa dibaca lalu ditutup.
 *
 * NOMORNYA nomor yang dilihat anaknya waktu mengerjakan — urutan undian sesi
 * (`item_ids`), bukan urutan waktu menjawab dan bukan urutan baru yang dikarang
 * layar ini. Petak "4" di sini dan "Soal 4 dari 10" di layar latihan harus
 * menunjuk soal yang sama, kalau tidak nomornya justru menyesatkan.
 *
 * Warnanya sama persis dengan bilah dan legenda di kepala halaman, jadi tidak
 * ada arti warna kedua yang perlu diingat sambil menggulung.
 */
export function NomorJawaban({
  soal,
  tautan,
  aktif,
  kolom,
  className = '',
}: {
  soal: { nomor: number; hasil: HasilSoal }[]
  /**
   * Alamat tiap nomor, kalau nomornya memang bisa dibuka. Sebuah fungsi dan
   * bukan satu alamat berimbuhan: yang memutuskan bentuk tautannya pemanggil,
   * dan komponen ini tidak perlu tahu bahwa jangkarnya kebetulan `#soal-4`.
   */
  tautan?: (nomor: number) => string | null
  /** Nomor soal yang sedang dibuka, kalau deretannya sedang jadi penunjuk arah. */
  aktif?: number
  /**
   * Susun sebagai kisi sekian kolom yang melar memenuhi lebar, bukan deretan
   * petak 32px yang melipat seadanya.
   *
   * Bedanya bukan rupa melainkan maksud. Deretan yang melipat menyisakan ruang
   * kosong di ujung baris terakhir — bentuk yang benar untuk daftar yang
   * panjangnya kebetulan sekian. Kisi mengatakan hal lain: bahwa sepuluh petak
   * ini SATU KESATUAN yang memang sepuluh, dan barisnya rapi karena memang
   * begitu paketnya dibagi.
   */
  kolom?: number
  className?: string
}) {
  if (soal.length === 0) return null
  if (kolom) {
    return (
      <span
        role="list"
        className={`grid gap-1.5 ${className}`}
        style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0, 1fr))` }}
      >
        {soal.map(s => (
          <span key={s.nomor} role="listitem" className="flex">
            <PetakNomor
              nomor={s.nomor}
              hasil={s.hasil}
              href={tautan?.(s.nomor)}
              aktif={s.nomor === aktif}
              penuh
            />
          </span>
        ))}
      </span>
    )
  }
  return (
    <span role="list" className={`flex flex-wrap gap-1.5 ${className}`}>
      {soal.map(s => (
        <span key={s.nomor} role="listitem" className="flex">
          <PetakNomor
            nomor={s.nomor}
            hasil={s.hasil}
            href={tautan?.(s.nomor)}
            aktif={s.nomor === aktif}
          />
        </span>
      ))}
    </span>
  )
}
