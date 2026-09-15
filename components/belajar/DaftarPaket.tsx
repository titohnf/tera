'use client'

import { useEffect, useState, useTransition } from 'react'
import type { PaketTopik } from '@/lib/belajar/sesi'
import type { PaketPeta } from '@/lib/belajar/topik-peta'
import { namaPaket } from '@/lib/belajar/nama-paket'
import { mulaiPaket, mulaiPaketPeta, muatPaket, muatPaketPeta } from '@/app/belajar/actions'
import { persenDari } from '@/lib/belajar/penilaian'
import { labelSesiWib } from '@/lib/waktu'
import { SOAL_PER_PAKET } from '@/lib/belajar/aturan'

/**
 * Paket-paket sebuah topik, dan keadaan masing-masing.
 *
 * Sebuah paket LATIHAN bukan undian: isinya potongan tetap dari bank soal
 * topiknya — Paket 1 selalu soal yang sama, bagi siapa pun, kapan pun. Karena
 * itu layar ini daftar, bukan satu tombol "Mulai Latihan": yang dipilih anak
 * bukan "sepuluh soal entah yang mana", melainkan bagian mana dari topik ini
 * yang mau ia hadapi.
 *
 * PAKET UJIAN SATU-SATUNYA PENGECUALIAN, sejak migrasi 177. Ia menyajikan dua
 * belas butir yang diambil acak berjenjang dari kolam ujian topiknya, sekali,
 * saat dibuka — dan sampel itu berbeda untuk tiap murid. Alasannya ada di
 * kepala migrasi itu: ujian hanya boleh dikerjakan sekali dan tidak punya
 * putaran kedua, jadi satu lembar soal yang sama untuk seluruh angkatan
 * berhenti mengukur apa pun begitu satu anak selesai lebih dulu.
 *
 * Akibatnya di layar ini: `total` sebuah paket ujian adalah 12 — bukan besar
 * kolamnya — dan sebelum ujiannya dibuka, petak soalnya kosong. Belum ada dua
 * belas butir yang menjadi miliknya; kartunya menyebut berapa yang akan
 * datang, bukan yang mana.
 *
 * Tiap baris menyebutkan tiga hal, dan ketiganya menentukan apakah baris itu
 * masih bisa diketuk:
 *
 *   berapa benar    keadaan sekarang dari soal-soal paket itu — hanya bisa naik
 *   putaran         sudah berapa kali dikerjakan sampai tuntas
 *   terkunci        kuncinya sudah dibuka, jadi nilainya berhenti di situ
 *
 * WAJIB DAN PENGAYAAN, DI KARTUNYA MASING-MASING. Cakupan Bloom tiap topik
 * (182) sudah lama memutuskan bahwa hanya sebagian paket yang menentukan
 * ketuntasan, dan anak yang melihat enam kartu sederajat menyimpulkan
 * enam-enamnya diminta. Pembedanya sempat berupa judul kelompok berikut satu
 * kalimat keterangan di atas tiap kelompok; keduanya sudah dihapus.
 *
 * Alasannya: keterangan yang berdiri di atas kelompok cuma terbaca oleh yang
 * kebetulan menggulir lewat batasnya. Anak yang matanya jatuh di kartu keempat
 * tidak punya cara tahu kartu itu wajib atau tidak tanpa menggulir balik
 * mencari judul yang menaunginya — dan itu persis pertanyaan yang paling sering
 * ia punya. Sekarang penandanya menempel di kartunya sendiri, jadi jawabannya
 * ada di tempat pertanyaannya muncul.
 *
 * Penandanya cuma menyala kalau topiknya memang punya dua jenis. "Wajib" di
 * setiap kartu pada topik yang seluruh paketnya wajib bukan keterangan, cuma
 * perabot — dan penanda yang selalu sama tidak membedakan apa pun.
 *
 * Ditambah satu keadaan yang hanya dipunyai paket ujian sejak migrasi 189:
 * `menungguLatihan`, yang menutup pintunya sampai seluruh paket latihan dalam
 * cakupan topiknya tuntas. Ujian berdiri paling akhir di daftar ini karena
 * urutan yang sama, dan keduanya menjawab satu hal: ujian sekali seumur topik,
 * jadi ia tidak boleh jadi kartu pertama yang diketuk anak yang baru datang.
 *
 * Paket yang sudah benar semua juga tidak bisa diketuk lagi, dan itu bukan
 * hukuman melainkan kabar baik yang tidak perlu diulang.
 *
 * MELAYANI DUA JALUR. `sumber` menentukan paket ini milik topik kurikulum
 * (latihan bebas) atau topik peta kompetensi. Yang berbeda cuma dari mana
 * datanya datang dan bagaimana barisnya dinamai — "Paket 3" versus "Paket C2 —
 * Memahami" — sedangkan aturan apa yang boleh diketuk sama persis untuk
 * keduanya. Menyalin komponen ini demi perbedaan sebesar itu berarti dua tempat
 * yang harus diingat bersamaan setiap kali aturannya berubah.
 */
/** Kunci sebuah baris paket: nomor untuk jalur grup, id untuk jalur peta. */
type Sumber = { jenis: 'grup'; groupId: string } | { jenis: 'peta'; topikId: string }

/** Bentuk seragam yang dirender layar ini, apa pun jalurnya. */
interface Baris extends PaketTopik {
  /** Yang diteruskan ke aksi pembuka — nomor paket, atau id paket. */
  kunci: string
  judul: string
  /** Level Bloom paket latihan; null untuk ujian dan untuk jalur grup. */
  levelBloom: number | null
  /**
   * Kapan paket yang terkunci terbuka sendiri (ISO), atau null.
   *
   * Hanya jalur peta yang punya ini. Latihan bebas mengunci permanen — kolam
   * dan aturannya lain — jadi barisnya memang tidak membawa apa-apa di sini,
   * dan layarnya jatuh ke kalimat lama.
   */
  bukaPada?: string | null
  /**
   * Ujian yang masih menunggu paket latihan topiknya tuntas (migrasi 189).
   *
   * Hanya jalur peta yang punya ini; latihan bebas tidak punya paket ujian sama
   * sekali. Undefined dibaca sebagai "tidak menunggu apa-apa".
   */
  menungguLatihan?: boolean
  /**
   * Paket latihan di luar cakupan Bloom topiknya (189).
   *
   * Hanya jalur peta yang punya ini; bab kurikulum tidak punya cakupan Bloom,
   * jadi di sana tidak ada paket yang perlu dibedakan wajib atau bukan.
   */
  pengayaan?: boolean
  /**
   * Latihan atau ujian. Hanya jalur peta yang punya paket ujian, jadi jalur
   * grup membiarkannya undefined — dan yang memakainya (penanda wajib) memang
   * cuma menyala di jalur peta.
   */
  jenis?: 'latihan' | 'ujian'
}

/**
 * "besok pukul 09.56" — kapan paket yang terkunci bisa dicoba lagi.
 *
 * Memakai `labelSesiWib` supaya sebutan harinya sama persis dengan yang dipakai
 * jadwal sesi di beranda keluarga: satu produk tidak boleh menyebut hari esok
 * dengan dua cara.
 */
function kapanTerbuka(iso: string, hariIniWib: string): string {
  const l = labelSesiWib(iso, hariIniWib)
  // "besok pukul 16.56" — tapi "Jumat, 4 September pukul 16.56". Sebutan
  // relatif jatuh di tengah kalimat jadi huruf kecil; nama hari dan bulan tidak
  // pernah. `labelSesiWib` memulangkan tanggal penuh di `hari` begitu jaraknya
  // lebih dari lusa — keadaan yang muncul kalau `jeda_buka_paket_jam` disetel
  // lebih panjang daripada 24.
  const hari = l.hari === l.tanggal ? l.hari : l.hari.toLowerCase()
  return `${hari} pukul ${l.jam}`
}

/**
 * Gembok dan centang — keadaan sebuah kartu, sebelum satu kata pun dibaca.
 *
 * SVG, bukan emoji: emoji digambar fon perangkat, jadi warnanya tidak bisa
 * diikutkan warna teks di sekitarnya dan bentuknya berbeda antara iOS, Android,
 * dan Windows. Ukurannya pun ikut fon, yang membuat perataannya meleset di
 * sebagian ponsel.
 */
function IkonGembok() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function IkonCentang() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

/**
 * Warna satu lingkaran per soal, urut dari yang terbaik.
 *
 * DIURUTKAN, bukan digambar sesuai urutan soalnya — dan itu disengaja. Layar
 * ini tidak tahu soal ke berapa yang salah (yang tahu halaman hasil, dan di
 * sana nomornya memang ditulis), jadi menyusunnya acak cuma akan mengarang
 * urutan yang tidak berarti apa-apa. Yang diurutkan justru terbaca sebagai satu
 * ukuran: sejauh mana hijaunya sudah berjalan.
 *
 * Jumlahnya selalu persis `total`. Data yang cacat — jumlah keadaan melebihi
 * butir paketnya — dipotong alih-alih melahirkan baris lingkaran yang lebih
 * panjang daripada kartunya.
 */
function warnaSoal(p: Baris): string[] {
  const w = [
    ...Array<string>(p.benar).fill('bg-emerald-500'),
    ...Array<string>(p.sebagian).fill('bg-amber-400'),
    ...Array<string>(p.salah).fill('bg-rose-400'),
  ].slice(0, p.total)
  while (w.length < p.total) w.push('bg-gray-200')
  return w
}

/** Satu paket peta jadi baris layar. Dipakai dua kali: dari server, dan dari browser. */
function dariPeta(p: PaketPeta): Baris {
  return {
    nomor: p.nomor,
    total: p.total,
    benar: p.benar,
    sebagian: p.sebagian,
    salah: p.salah,
    belum: p.belum,
    skor: p.skor,
    maks: p.maks,
    putaran: p.putaran,
    terkunci: p.terkunci,
    kunci: p.paketId,
    judul: namaPaket(p),
    levelBloom: p.levelBloom,
    bukaPada: p.bukaPada,
    menungguLatihan: p.menungguLatihan,
    pengayaan: p.pengayaan,
    jenis: p.jenis,
  }
}

export default function DaftarPaket({
  anak,
  sumber,
  jumlahSoal,
  awal,
  hariIniWib,
}: {
  anak: string | undefined
  sumber: Sumber
  /** Soal di topik ini — dipakai menggambar kerangka sebelum datanya datang. */
  jumlahSoal: number
  /**
   * Daftar paket yang sudah dibawa server, kalau ada.
   *
   * Topik yang terbentang sejak halaman dibuka tidak perlu menjemput isinya
   * sendiri: menjemput berarti kerangka abu-abu dulu, lalu satu perjalanan
   * jaringan, lalu isinya — dan setiap kegagalan perjalanan itu berakhir
   * sebagai kartu kosong yang tidak bisa dibedakan dari topik yang memang belum
   * punya soal. Topik yang dibuka dengan ketukan tetap menjemput sendiri, dan
   * di situ jeda memang wajar: orangnya baru saja meminta.
   */
  awal?: PaketPeta[]
  /**
   * Hari ini dalam WIB (`YYYY-MM-DD`), dari server. Opsional karena jalur grup
   * tidak memakainya: latihan bebas mengunci permanen, jadi tidak ada waktu
   * terbuka yang perlu disebut.
   */
  hariIniWib?: string
}) {
  const [paket, setPaket] = useState<Baris[] | null>(awal ? awal.map(dariPeta) : null)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  const kunciSumber = sumber.jenis === 'grup' ? sumber.groupId : sumber.topikId

  useEffect(() => {
    // Sudah dibawa server; tidak ada yang perlu dijemput.
    if (awal) return
    let hidup = true
    const muat: Promise<Baris[]> =
      sumber.jenis === 'grup'
        ? muatPaket(anak, sumber.groupId).then(d =>
            // `levelBloom: null` untuk jalur grup: bab kurikulum tidak punya
            // level Bloom.
            d.map(p => ({
              ...p,
              kunci: String(p.nomor),
              judul: `Paket ${p.nomor}`,
              levelBloom: null,
            }))
          )
        : muatPaketPeta(anak, sumber.topikId).then(d => d.map(dariPeta))

    muat
      .then(d => {
        if (hidup) setPaket(d)
      })
      .catch(() => {
        if (hidup) setPaket([])
      })
    return () => {
      hidup = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anak, sumber.jenis, kunciSumber])

  function buka(kunci: string) {
    setGalat(null)
    mulai(async () => {
      const hasil =
        sumber.jenis === 'grup'
          ? await mulaiPaket(anak, sumber.groupId, Number(kunci))
          : await mulaiPaketPeta(anak, kunci)
      if (hasil && 'error' in hasil) setGalat(hasil.error)
    })
  }

  if (paket === null) {
    // Kerangka sebanyak paket yang PASTI ada, dihitung dari jumlah soalnya.
    // Kerangka yang jumlahnya asal membuat layar melompat begitu data datang.
    const perkiraan = Math.max(1, Math.ceil(jumlahSoal / SOAL_PER_PAKET))
    return (
      <div className="space-y-2">
        {Array.from({ length: perkiraan }, (_, i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-xl bg-white shadow-kartu" />
        ))}
      </div>
    )
  }

  if (paket.length === 0) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-500 shadow-kartu">
        Topik ini belum punya soal, jadi latihannya belum bisa dimulai.
      </p>
    )
  }

  // Ada dua kelompok atau tidak sama sekali. Dihitung sekali di sini, bukan di
  // dalam `map`, supaya baris pertama tahu ia perlu berjudul.
  const adaPengayaan = paket.some(p => p.pengayaan)

  return (
    <div className="space-y-2">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {paket.map(p => {
        const tuntas = p.benar >= p.total
        // Gerbang ujian (189). Satu-satunya keadaan di layar ini yang menutup
        // pintu karena sesuatu di paket LAIN, jadi ia disebutkan — baris mati
        // tanpa sebab adalah yang membuat orang mengetuknya berkali-kali.
        const menunggu = p.menungguLatihan === true
        const bisa = !p.terkunci && !tuntas && !menunggu
        const persen = p.maks > 0 ? persenDari(p.skor, p.maks) : null
        const belumTersentuh = p.putaran === 0

        // Penandanya cuma untuk paket LATIHAN. Ujian bukan salah satu dari
        // "paket wajib" yang harus tuntas — ia yang menunggu mereka tuntas —
        // dan menempelinya penanda "Wajib" akan membuat kartu terakhir tampak
        // sebagai syarat yang keenam. Namanya sendiri sudah menyebut ia apa.
        const penanda =
          adaPengayaan && p.jenis !== 'ujian' ? (p.pengayaan ? 'Pengayaan' : 'Wajib') : null

        const ajakan = !bisa
          ? null
          : p.jenis === 'ujian'
            ? 'Mulai ujian'
            : belumTersentuh
              ? 'Mulai kerjakan'
              : 'Kerjakan lagi'

        const isi = (
          <>
            {penanda && (
              // Penandanya paling atas, sebaris sendiri. Ia menjawab pertanyaan
              // yang datang lebih dulu daripada "paket apa ini" — yaitu "ini
              // perlu saya kerjakan atau tidak".
              //
              // WAJIB BIRU, PENGAYAAN AMBER. Dua warna, bukan satu warna dan
              // satu kelabu: kelabu di seluruh permukaan ini berarti "mati" —
              // kartu terkunci, teks yang meredup, petak yang belum terisi —
              // jadi penanda kelabu membuat pengayaan terbaca sebagai sesuatu
              // yang tidak bisa dikerjakan, padahal ia justru terbuka. Amber
              // menandainya sebagai jalur yang lain, bukan jalur yang tertutup.
              //
              // Di kartu yang sudah mati warnanya ikut memudar: penanda
              // berwarna pada kartu kelabu adalah satu-satunya benda mencolok
              // di sana, dan ia akan menarik mata justru ke kartu yang tidak
              // bisa diapa-apakan.
              <span className="flex">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    !bisa
                      ? 'bg-white text-gray-400 ring-1 ring-gray-200'
                      : p.pengayaan
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {penanda}
                </span>
              </span>
            )}

            <span className={`flex items-start gap-2.5 ${penanda ? 'mt-2' : ''}`}>
              {/* Ikon keadaan, dan HANYA untuk kartu yang mati. Kartu hidup
                  tidak butuh ikon "bisa dikerjakan" — tombolnya di bawah sudah
                  mengatakannya dengan kata-kata, dan ikon ketiga yang muncul di
                  setiap kartu akan meratakan kembali perbedaan yang baru saja
                  dibangun. */}
              {!bisa && (
                <span
                  className={`mt-0.5 shrink-0 ${tuntas ? 'text-emerald-500' : 'text-gray-400'}`}
                >
                  {tuntas ? <IkonCentang /> : <IkonGembok />}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span
                    className={`text-sm font-semibold ${bisa ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    {p.judul}
                  </span>
                  <span className="text-xs text-gray-400">{p.total} soal</span>
                </span>
                <span
                  className={`mt-0.5 block text-sm ${bisa ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {belumTersentuh
                    ? 'Belum dikerjakan'
                    : `${p.benar} dari ${p.total} benar${
                        p.putaran > 1 ? ` · ${p.putaran} putaran` : ''
                      }`}
                </span>
                {p.terkunci && (
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {/* Kapan ia terbuka lagi disebutkan kalau memang ada
                        waktunya. Baris mati tanpa satu kata pun tentang kapan
                        ia hidup kembali adalah yang membuat anak mengira
                        topiknya habis — padahal paket latihan membuka sendiri
                        sesudah jeda, dan yang perlu ia lakukan cuma kembali
                        besok. */}
                    {p.bukaPada && hariIniWib
                      ? `Terbuka lagi ${kapanTerbuka(p.bukaPada, hariIniWib)}`
                      : 'Terkunci — kuncinya sudah dibuka'}
                  </span>
                )}
                {menunggu && (
                  <span className="mt-0.5 block text-xs text-gray-400">
                    Terbuka setelah semua paket wajib tuntas
                  </span>
                )}
              </span>
              {persen != null && !belumTersentuh && (
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    bisa ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {persen}%
                </span>
              )}
            </span>

            {/* SATU LINGKARAN SATU SOAL, berwarna menurut jawabannya.
                
                Batang menerus sebelumnya ambigu, dan ambigu dengan cara yang
                paling mahal: ia menggambar butir yang benar, sedangkan angka
                persen tepat di atasnya adalah NILAI — dua besaran berbeda yang
                untuk 7 dari 8 sama-sama jatuh di 88%. Tidak ada satu pun cara
                bagi yang melihatnya untuk tahu yang mana yang sedang digambar.
                
                Lingkaran yang bisa dihitung tidak punya masalah itu: delapan
                lingkaran untuk delapan soal, persis seperti kalimat "6 dari 8
                benar" di atasnya. Satuannya kelihatan, jadi ia tidak mungkin
                dibaca sebagai persentase.
                
                WARNANYA SAMA DENGAN LAYAR HASIL — hijau benar, kuning sebagian
                benar, merah salah, kelabu belum dijawab. Petak bernomor di
                layar hasil sudah memakai keempat warna itu sejak lama, dan anak
                yang baru menutup sebuah paket membawa arti warna itu di
                kepalanya. Memakai warna yang sama di sini berarti tidak ada
                yang perlu dipelajari dua kali; memakai warna lain berarti dua
                bahasa untuk satu hal.
                
                Tidak digambar untuk paket yang belum disentuh: deretan
                lingkaran kosong adalah gambar tentang ketiadaan, dan ia muncul
                justru di kartu yang paling ingin kita buat menarik. */}
            {!belumTersentuh && p.total > 0 && (
              <span className="mt-2.5 flex flex-wrap gap-1.5" aria-hidden>
                {warnaSoal(p).map((w, i) => (
                  <span key={i} className={`h-2.5 w-2.5 rounded-full ${w}`} />
                ))}
              </span>
            )}

            {/* TOMBOL SUNGGUHAN, bukan teks biru. Seluruh kartu memang sudah
                jadi tombol sejak dulu, tapi bentuknya sama persis dengan kartu
                yang tidak bisa diapa-apakan — dan satu-satunya pembedanya latar
                yang berubah saat disentuh kursor, yang di ponsel tidak ada.
                Bentuk tombol adalah satu-satunya isyarat "ini bisa ditekan"
                yang terbaca tanpa disentuh lebih dulu.

                Ia `span`, bukan `button`: kartunya sendiri yang tombol, dan
                tombol di dalam tombol bukan HTML yang sah.
                
                SATU WARNA UNTUK SEMUA, wajib maupun pengayaan. Tombol yang
                warnanya berbeda-beda menuntut dibaca lebih dulu sebelum
                dikenali sebagai tombol, dan itu membatalkan sendiri alasan ia
                dibuat berbentuk tombol. Perbedaan bobot paketnya sudah dipikul
                penanda di kepala kartu — mengulanginya di tombol berarti satu
                keterangan yang sama dikatakan dua kali dengan dua bahasa.
                
                DAN SEMUANYA SEKUNDER — bergaris, bukan biru pekat. Di halaman
                ini cuma ada SATU tombol biru penuh, yaitu tombol rekomendasi
                berikutnya di kartu paling atas. Itulah gunanya tombol primer:
                menunjuk satu hal dari sekian banyak. Enam tombol pekat di
                bawahnya membuat penunjuk itu tidak menunjuk apa-apa lagi,
                sedangkan yang bergaris tetap terbaca sebagai tombol tanpa ikut
                berebut perhatian. */}
            {ajakan && (
              <span className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                {/* Sisa salahnya, tepat di sebelah tombol yang akan
                    mengerjakannya. "Kerjakan lagi" tidak menyebutkan seberapa
                    besar pekerjaannya, dan dua soal terasa sangat berbeda dari
                    delapan — perbedaan yang menentukan anak menekannya sekarang
                    atau menundanya. Angkanya juga bukan nilai, jadi ia tidak
                    menyeberangkan apa pun yang FR3 larang.

                    Ruang ini kosong untuk paket yang belum disentuh: di sana
                    seluruh soalnya masih menunggu, dan "8 soal masih salah"
                    untuk paket yang belum pernah dibuka adalah kalimat yang
                    tidak benar. */}
                <span className="text-xs text-gray-400">
                  {/* "Belum benar", bukan "masih salah": hitungannya
                      `total - benar`, jadi ia ikut memuat soal yang SEBAGIAN
                      benar — lingkaran kuning di atas. Menyebut yang kuning
                      sebagai salah membuat kalimat ini membantah gambarnya
                      sendiri. */}
                  {!belumTersentuh && p.total - p.benar > 0
                    ? `${p.total - p.benar} soal belum benar`
                    : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                  {ajakan}
                  <span aria-hidden>›</span>
                </span>
              </span>
            )}
          </>
        )

        // DUA BENTUK KARTU, dan inilah perbedaan yang sebenarnya dikerjakan
        // layar ini. Yang hidup mengambang: putih, berbayang, bertombol. Yang
        // mati rata dengan latar halaman — kelabu, bergaris tipis, tanpa
        // bayangan sama sekali. Sebelumnya keduanya kartu putih berbayang yang
        // sama persis dan bedanya cuma `opacity-70`, yang di layar terbaca
        // sebagai "gambarnya belum selesai dimuat", bukan sebagai "yang ini
        // memang belum bisa".
        const gaya = 'flex w-full flex-col rounded-xl p-4 text-left'

        return bisa ? (
          <button
            key={p.kunci}
            type="button"
            disabled={sibuk}
            onClick={() => buka(p.kunci)}
            className={`${gaya} bg-white shadow-kartu transition hover:bg-slate-100 disabled:opacity-60`}
          >
            {isi}
          </button>
        ) : (
          // Bukan tombol mati melainkan bukan tombol sama sekali: sasaran ketuk
          // yang tidak melakukan apa-apa membuat orang mengetuknya berkali-kali
          // untuk memastikan.
          <div key={p.kunci} className={`${gaya} border border-gray-200 bg-slate-50`}>
            {isi}
          </div>
        )
      })}
    </div>
  )
}
