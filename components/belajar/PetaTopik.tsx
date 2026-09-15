'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { LangkahTopik, PaketRingkas } from '@/lib/belajar/langkah'
import { kelompokkanPeta, sebutPrasyarat } from '@/lib/belajar/fringe'
import { kodePaket } from '@/lib/belajar/nama-paket'
import { labelSesiWib } from '@/lib/waktu'
import { namaTema } from '@/lib/belajar/tema-topik'
import { mulaiLangkahTopik } from '@/app/belajar/actions'

/**
 * Peta kompetensi: topik yang boleh dikerjakan anak ini, berurut menurut
 * prasyarat — bukan menurut bab buku teks.
 *
 * Permukaan yang menggantikan pemilihan lewat topik kurikulum untuk
 * Matematika. Bedanya bukan tampilan melainkan pertanyaannya: pemilih lama
 * bertanya "mau latihan bab yang mana", peta ini bertanya "kamu siap belajar
 * apa". Bab menyusul jadwal les dan berbeda antar program; kesiapan tidak.
 *
 * TIGA KELOMPOK, BUKAN SATU DAFTAR RATA. Sampai sebelum ini seluruh topik
 * berdiri sebagai akordeon sederajat, dan seluruh kecerdasan peta ini —
 * prasyarat, status, level Bloom — cuma tampil sebagai label kecil di baris.
 * Akibatnya layar ini terbaca sama saja dengan `/belajar`: daftar panjang,
 * pilih sendiri. Yang membedakan misi dari prasmanan bukan kuncinya melainkan
 * apa yang muncul saat halaman dibuka, jadi yang siap dikerjakan dibentangkan
 * dan sisanya dilipat. Pembagiannya sendiri ada di `lib/belajar/fringe.ts`,
 * beserta alasan mengapa "satu topik pada satu waktu" tidak bisa dibangun di
 * atas graf prasyarat ini.
 *
 * SATU ALUR, BUKAN PRASMANAN. Sampai sebelum migrasi 190, mengetuk sebuah topik
 * membentangkan daftar paketnya — C1 sampai C6 plus ujian — dan anak memilih
 * sendiri. Daftar itu jujur tapi tidak menjawab pertanyaan yang membawanya ke
 * sini, dan ongkos memilihnya dibayar ulang setiap kunjungan untuk jawaban yang
 * hampir selalu sama. Sekarang langkah berikutnya berdiri sebagai TOMBOL di
 * barisnya — seluruh paket latihan masuk ke soal tanpa perantara — dan halaman
 * topik cuma disinggahi di satu titik: sesudah paket wajib terakhir lolos,
 * tempat anak memilih antara pengayaan dan ujian.
 *
 * DAFTAR PAKETNYA TIDAK HILANG, ia pindah ke halaman topik — satu tempat, bukan
 * dua. Selama daftar yang sama hidup di dua layar, keduanya harus diingat
 * bersamaan setiap kali aturan paket berubah, dan yang terlupa selalu yang
 * jarang dibuka.
 *
 * DAFTARNYA DATANG DARI SERVER, bukan dijemput sendiri sesudah komponennya
 * hidup. Versi pertama memanggil `muatPeta()` di dalam `useEffect`, dan itu
 * punya dua akibat yang cuma kelihatan setelah dipakai: petanya baru muncul
 * satu perjalanan jaringan sesudah sisa halaman — sering terbaca sebagai "harus
 * dimuat ulang dulu baru muncul" — dan setiap kegagalan panggilan berakhir
 * sebagai layar yang diam, karena tidak adanya topik dan gagalnya pertanyaan
 * menghasilkan tampilan yang sama persis: tidak ada apa-apa.
 *
 * Halaman Misi sudah tahu atas nama siapa ia dibuka, jadi ia pula yang
 * bertanya. Yang tersisa di browser cuma yang memang milik browser: kelompok
 * mana yang sedang dibuka.
 *
 * PRASYARAT MEMBERI TAHU, BUKAN MEMBLOKIR. Topik yang prasyaratnya belum
 * tuntas tetap bisa diketuk, cuma disertai keterangan — sekarang dari balik
 * satu lipatan, bukan dari tengah daftar. Satu ketukan friksi bukan pintu yang
 * terkunci: tanpa pengukuran yang lengkap, satu-satunya yang sistem tahu adalah
 * apa yang sudah pernah ia ukur sendiri, dan mengunci anak dari topik yang
 * mungkin sudah ia kuasai di sekolah adalah menghukum orang atas kekurangan
 * kita sendiri.
 */
export default function PetaTopik({
  anak,
  topik,
  langkah,
  paket,
  hariIni,
}: {
  anak: string | undefined
  topik: TopikPeta[]
  /**
   * Langkah berikutnya tiap topik (migrasi 190), dibawa server bersama
   * halamannya. Topik yang tidak punya barisnya di sini tetap digambar — tanpa
   * indikator, dan ketukannya jatuh ke halaman topik seperti biasa.
   */
  langkah: LangkahTopik[]
  /**
   * Keadaan tiap paket seluruh topik (194) — bahan deretan keping di kartu.
   * Urutannya sudah urutan gambarnya sejak dari database; komponen ini cuma
   * mengelompokkannya per topik dan tidak menyusun ulang apa pun.
   */
  paket: PaketRingkas[]
  /**
   * Tanggal hari ini di WIB (`YYYY-MM-DD`), dibaca server dan diturunkan ke
   * sini — bukan dibaca sendiri saat render. Alasannya di `lib/waktu.ts`: jam
   * server dan jam perangkat pembaca tidak sama, dan komponen ini dirender di
   * kedua sisi. Dipakai untuk mengubah jam terbukanya paket yang terkunci
   * menjadi "Besok, 12.57".
   */
  hariIni: string
}) {
  const { siap, belum, tuntas } = useMemo(() => kelompokkanPeta(topik), [topik])

  // Kode topik ke namanya, untuk keterangan prasyarat. Seluruh topik ikut,
  // bukan cuma yang terlipat: prasyarat sebuah topik di `belum` bisa saja topik
  // yang sedang berdiri di `siap`.
  const namaTopik = useMemo(() => new Map(topik.map(t => [t.id, t.nama])), [topik])
  const perTopik = useMemo(() => new Map(langkah.map(l => [l.topikId, l])), [langkah])

  // Dikelompokkan sekali untuk seluruh peta, bukan disaring ulang di tiap
  // baris: sembilan belas topik yang masing-masing menyapu daftar 133 paket
  // adalah pekerjaan kuadratik yang dibayar tiap kali komponen ini dirender.
  const paketTopik = useMemo(() => {
    const m = new Map<string, PaketRingkas[]>()
    for (const p of paket) {
      const ada = m.get(p.topikId)
      if (ada) ada.push(p)
      else m.set(p.topikId, [p])
    }
    return m
  }, [paket])

  const [lihatBelum, setLihatBelum] = useState(false)
  const [lihatTuntas, setLihatTuntas] = useState(false)

  // Tidak ada topik berisi: layar ini tidak punya apa pun untuk ditawarkan, dan
  // yang benar adalah tidak muncul sama sekali — bukan menampilkan kerangka
  // kosong yang terbaca seperti aplikasi rusak.
  if (topik.length === 0) return null

  const baris = (t: TopikPeta) => (
    <Baris
      key={t.id}
      topik={t}
      anak={anak}
      langkah={perTopik.get(t.id)}
      paket={paketTopik.get(t.id) ?? []}
      namaTopik={namaTopik}
      hariIni={hariIni}
    />
  )

  return (
    <section className="space-y-5">
      {/* Frontier lebih dulu, dan tanpa lipatan. Ini satu-satunya kelompok yang
          menjawab pertanyaan yang membawa anak ke layar ini — "sekarang apa" —
          jadi ia tidak pernah bersembunyi di balik ketukan. */}
      {siap.length > 0 && (
        <div className="space-y-2">
          <div className="pt-4 pb-1">
            <h2 className="font-semibold tracking-tight text-gray-900">
              Siap untuk kamu sekarang
            </h2>
            {/* Kenapa yang lain tidak ada di sini, dikatakan sebelum ditanyakan.
                Tanpa baris ini, "belum siap (14)" di bawah terbaca sebagai
                empat belas hal yang ketinggalan — terutama oleh orang tua yang
                ikut memegang ponselnya. */}
            <p className="mt-0.5 text-xs text-gray-400">
              {siap.length === 1
                ? 'Satu topik yang prasyaratnya sudah kamu lewati.'
                : `${siap.length} topik yang prasyaratnya sudah kamu lewati. Kerjakan yang mana saja.`}
            </p>
          </div>
          {/* Jarak antar kartu 16px, bukan 8px. Kartunya sudah bukan baris
              lagi — ia punya kepala, judul, deret keping, dan footer bergaris —
              dan pada 8px footer kartu pertama terbaca seolah masih milik kartu
              kedua. Aturannya sederhana dan berlaku ke bawah: jarak antar KARTU
              harus lebih lebar daripada jarak antar segmen DI DALAM kartu, dan
              di dalam sana jaraknya 12px. */}
          <div className="space-y-4">{siap.map(baris)}</div>
        </div>
      )}

      {/* Frontier kosong sementara masih ada topik yang belum tuntas: keadaan
          yang wajar di awal, bukan galat. Kalimatnya menunjuk ke lipatan di
          bawah alih-alih membiarkan layar tampak habis. */}
      {siap.length === 0 && belum.length > 0 && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-kartu">
          <p className="text-sm font-semibold text-gray-900">Belum ada yang terbuka</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Topik yang prasyaratnya sudah kamu lewati belum ada. Kamu tetap boleh
            membuka topik mana pun dari daftar di bawah.
          </p>
        </div>
      )}

      <Lipatan
        judul="Belum siap"
        jumlah={belum.length}
        terbuka={lihatBelum}
        onKetuk={() => setLihatBelum(!lihatBelum)}
        /* Kalimat pembuka lipatan, bukan sesudahnya: yang membukanya perlu
           membaca lebih dulu bahwa isinya boleh dikerjakan. */
        keterangan="Prasyaratnya belum tuntas, tapi kamu tetap boleh mengerjakannya."
      >
        {belum.map(baris)}
      </Lipatan>

      <Lipatan
        judul="Sudah tuntas"
        jumlah={tuntas.length}
        terbuka={lihatTuntas}
        onKetuk={() => setLihatTuntas(!lihatTuntas)}
      >
        {tuntas.map(baris)}
      </Lipatan>
    </section>
  )
}

/**
 * Satu kelompok terlipat. Tidak dirender sama sekali kalau isinya kosong —
 * "Sudah tuntas (0)" adalah baris yang mengabarkan ketiadaan, dan anak yang
 * baru mulai akan membaca dua lipatan kosong sebagai layar yang rusak.
 */
function Lipatan({
  judul,
  jumlah,
  terbuka,
  onKetuk,
  keterangan,
  children,
}: {
  judul: string
  jumlah: number
  terbuka: boolean
  onKetuk: () => void
  keterangan?: string
  children: React.ReactNode
}) {
  if (jumlah === 0) return null
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onKetuk}
        aria-expanded={terbuka}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-slate-100"
      >
        <span className="text-gray-300" aria-hidden>
          {terbuka ? '▾' : '▸'}
        </span>
        <span className="text-sm font-medium text-gray-500">
          {judul} ({jumlah})
        </span>
      </button>
      {terbuka && (
        <div className="space-y-4">
          {keterangan && <p className="px-1 text-xs text-gray-400">{keterangan}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Satu baris topik: badannya KABAR, tombolnya PINTU.
 *
 * SELURUH JALAN KELUAR LEWAT TOMBOL, tidak ada satu pun lewat badan barisnya.
 * Sampai sebelum ini seluruh baris adalah satu target ketukan yang artinya
 * berubah-ubah: kalau langkah berikutnya berupa paket latihan ia diam-diam
 * MELAHIRKAN SESI, kalau tidak ia cuma tautan ke halaman topik. Dua akibat yang
 * sangat berbeda memakai bentuk yang sama persis, dan yang membedakannya di
 * layar cuma sebaris teks kecil di dalam baris itu sendiri.
 *
 * Jadi badannya sekarang tidak bisa diketuk sama sekali. Ia menceritakan topik
 * — kode, nama, tema, status, prasyarat — dan berhenti di situ. Setiap yang
 * membawa anak ke suatu tempat berdiri di bawahnya sebagai tombol bertuliskan
 * kata kerjanya sendiri, dan tidak ada tempat lain yang bisa diketuk untuk
 * sampai ke sana. Konsekuensinya disengaja: tidak ada lagi ketukan yang
 * akibatnya harus ditebak dari teks kecil di sebelahnya.
 *
 * DUA TOMBOL, dan yang kedua bukan versi lain dari yang pertama. "Lihat
 * detail" selalu ada: apa pun keadaan topiknya, selalu ada halaman yang
 * menceritakannya lebih panjang daripada muat di baris ini — daftar paket,
 * riwayat sesi, jadwal yang terkunci. "Kerjakan soal" muncul di sampingnya
 * hanya kalau ada paket yang bisa dibuka detik ini, dan ia melompati halaman
 * itu sepenuhnya.
 *
 * Alasan keduanya berdiri berdampingan alih-alih bergantian: anak yang tahu
 * persis mau apa tidak perlu singgah, sementara anak yang ragu tidak perlu
 * memulai sesi untuk sekadar melihat isinya. Sebelum ini kedua kebutuhan itu
 * berebut satu ketukan, dan yang kalah selalu yang kedua — karena ketukannya
 * MENULIS, dan yang ditulis tidak bisa dibatalkan dengan tombol kembali.
 *
 * Yang TIDAK punya tombol biru cuma satu golongan: keadaan yang menyimpan
 * keputusan. Ujian sesudah paket wajib habis adalah cabang sungguhan —
 * pengayaan dulu atau ujian yang lahir sekali tanpa putaran kedua (189) — dan
 * paket yang terkunci belum punya apa pun untuk dibuka. Keduanya cuma
 * meninggalkan "Lihat detail".
 */
function Baris({
  topik: t,
  anak,
  langkah,
  paket,
  namaTopik,
  hariIni,
}: {
  topik: TopikPeta
  anak: string | undefined
  langkah?: LangkahTopik
  paket: PaketRingkas[]
  namaTopik: Map<string, string>
  hariIni: string
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  // KE SOAL LANGSUNG, TERMASUK UJIAN.
  //
  // Halaman transisi dulu berdiri di satu titik: sesudah paket wajib terakhir
  // lolos, saat langkahnya berpindah ke ujian. Alasannya ada dua — di situ ada
  // cabang (ambil pengayaan dulu, atau ujian sekarang) dan akibat yang tidak
  // bisa dibatalkan (sampelnya lahir sekali, 189).
  //
  // Pemilik produk memutuskan sebaliknya: tombolnya menyebut apa yang akan
  // dibuka ("Kerjakan Ujian"), dan yang menyebut dirinya sendiri tidak perlu
  // diperantarai. Cabang pengayaannya tidak hilang — ia tinggal di halaman
  // topik, satu ketukan "Lihat detail" dari sini — tapi ia sekarang harus
  // DICARI alih-alih dilewati. Itu pertukaran yang disengaja, bukan kelalaian:
  // yang tahu persis mau ujian tidak lagi membayar satu layar untuk itu.
  //
  // Yang tersisa tanpa tombol cuma paket yang sedang terkunci: di sana tidak
  // ada apa pun untuk dibuka, dan yang perlu dibaca justru KAPAN ia terbuka
  // lagi — sekarang tertulis langsung di barisnya.
  const langsung = langkah != null && langkah.paketId != null && !langkah.terkunci

  const alamat = anak ? `/keluarga/${anak}/misi/${t.id}` : null

  const ringkas = ringkasKartu(t, langkah, paket, hariIni)

  const isi = (
    <>
      {/* KEPALA KARTU: kodenya, temanya, statusnya — satu baris, tanpa ikon.
          Ikon temanya dulu berdiri di kiri. Ia dicabut karena tidak pernah
          benar-benar bekerja di sini: seluruh topik di peta ini Matematika, dan
          empat tema saja yang membaginya, jadi sembilan belas kartu memakai
          empat gambar yang sama berulang-ulang. Gambar yang berulang tidak
          membedakan apa pun — ia cuma menandai di mana kartu dimulai, pekerjaan
          yang sudah dilakukan jarak antar kartu.

          Dan ongkosnya nyata: ikon itu memaksa kode dan tema bertumpuk dua baris
          supaya ada yang mengisi tingginya. Tanpa ikon keduanya muat dalam satu
          baris, dan tiap kartu kehilangan satu baris yang tidak membawa kabar
          apa pun. Nama temanya sendiri tetap tertulis — yang hilang gambarnya,
          bukan keterangannya. */}
      <span className="flex w-full items-center gap-2">
        {/* KODENYA IKUT TAMPIL. Keterangan prasyarat di bawah menyebut topik
            dengan kodenya ("D-01") di samping namanya, dan tanpa kode di kartu
            ini anak harus mencocokkan nama panjang yang dua di antaranya
            berawal sama. */}
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-500">
          {t.id}
        </span>
        {/* Tema lebih dulu, jumlah paket sesudahnya: yang pertama menjawab "ini
            tentang apa", yang kedua "seberapa panjang". Anak yang membuka peta
            mencari yang pertama. Keduanya SIFAT TETAP topiknya dan tidak berubah
            apa pun yang dikerjakan anak hari itu — sebab itu mereka di sini, dan
            baris di bawah judul cuma memuat yang memang berubah. */}
        <span className="min-w-0 truncate text-xs text-gray-400">
          {namaTema(t.elemen)} · {t.jumlahPaket} paket
        </span>

        {/* Statusnya di UJUNG KANAN, bukan menempel pada judul. Tempatnya jadi
            tetap: label yang mengekor judul berpindah-pindah mengikuti panjang
            nama topik, dan mata yang memindai sembilan belas kartu harus
            mencarinya di posisi berbeda tiap kali. `ml-auto` mendorongnya
            sendiri ke kanan, jadi kartu tanpa status tidak menyisakan lubang. */}
        <span className="ml-auto shrink-0 pl-2">
          <LabelStatus status={t.status} />
        </span>
      </span>

      <span className="block w-full min-w-0">
        {/* Judul dan baris keterangannya satu tarikan napas — jarak 4px di
            antaranya, bukan 12px yang memisahkan segmen. */}
        <span className="block text-base font-semibold leading-snug text-gray-900">
          {t.nama}
        </span>

        {/* SATU BARIS UNTUK SEMUA KABAR YANG BERUBAH, bukan satu baris untuk
            tiap kabar. Sebelum ini keadaan langkah dan jadwal pengecekan ulang
            masing-masing punya barisnya sendiri; kartu yang paling ramai jadi
            enam baris tinggi, dan tiga topik saja sudah menghabiskan satu layar
            ponsel.

            Dan barisnya TIDAK DIGAMBAR sama sekali kalau tidak ada yang perlu
            dikatakan — itu keadaan yang paling umum, dan sebaris kosong setinggi
            enam belas piksel di tiap kartu adalah ruang yang dibayar sembilan
            belas kali untuk ketiadaan. */}
        {ringkas && (
          <span className="mt-1 block text-xs text-gray-400">{ringkas}</span>
        )}

        <span className="mt-3 block">
          <DeretPaket paket={paket} sekarang={langkah?.paketId ?? null} />
        </span>

        {!t.prasyaratTerpenuhi && t.status !== 'tuntas' && (
          // Yang satu ini TIDAK ikut dipadatkan ke baris ringkas, dan itu
          // disengaja: ia kalimat utuh sepanjang belasan kata, dan menyambungnya
          // dengan titik-titik pemisah membuat baris meta terbaca sebagai
          // paragraf yang kebetulan berwarna.
          //
          // Kalimatnya sengaja tidak melarang — yang disampaikan sebuah saran
          // urutan, bukan pintu yang tertutup. Dan tidak disampaikan sama sekali
          // kalau topiknya sudah TUNTAS: sarannya berbunyi "lebih mudah kalau X
          // dulu", sedangkan anak ini sudah menuntaskannya tanpa X.
          <span className="mt-3 block text-xs text-amber-700">
            Lebih mudah kalau {sebutPrasyarat(t.prasyaratKurang, namaTopik)} sudah
            dituntaskan dulu
          </span>
        )}
      </span>
    </>
  )

  return (
    <div className="space-y-1.5">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      <div className="rounded-xl bg-white shadow-kartu">
        {/* IKONNYA DI ATAS, ISINYA DI BAWAH — bukan berdampingan. Ikon di kiri
            memakan tiga puluh piksel dari setiap baris teks di sebelahnya, dan
            yang membayar bukan judulnya melainkan yang paling panjang: nama
            topik seperti "Data: perumusan pertanyaan, penyajian & interpretasi
            dasar" pecah jadi tiga baris di layar ponsel, dan deret kepingnya
            ikut menyempit sampai "Ujian" terlempar ke baris sendiri.
            Ditumpuk begini, seluruh isi kartu memakai lebar penuh. */}
        <div className="flex flex-col items-start gap-3 p-4">{isi}</div>

        {/* GARIS TIPIS MEMISAHKAN KABAR DARI TINDAKAN, dan ia menyentuh kedua
            tepi kartu. Jarak saja tidak cukup: kartu ini punya empat segmen yang
            beruntun ke bawah, dan mata membaca "yang berjarak lebih lebar"
            sebagai jeda yang sama jenisnya dengan jeda-jeda lain. Yang di bawah
            garis berbeda jenisnya — bukan lagi cerita tentang topik, melainkan
            dua hal yang bisa diketuk — dan batas itu pantas digambar, bukan
            cuma dirasakan.

            DUA TOMBOL, DUA PERTANYAAN BERBEDA. "Lihat detail" menjawab "ini
            sebenarnya apa" — daftar paketnya, riwayat sesinya, kapan yang
            terkunci terbuka lagi. "Kerjakan soal" menjawab "sekarang apa" dan
            tidak menanyakan apa pun lagi: ia langsung membuka paket yang
            direkomendasikan.

            Urutannya bukan selera. Yang MENULIS berdiri paling kanan — paling
            jauh dari jempol yang baru turun dari badan kartu — dan yang cuma
            membaca berdiri di kiri. Warnanya menegaskan hal yang sama: satu
            tombol berisi, satu tombol tenang. Yang tidak bisa dibatalkan tidak
            pernah jadi tombol yang paling gampang terpencet.

            `flex-wrap` supaya di layar sempit keduanya turun ke bawah alih-alih
            saling menggencet sampai labelnya terpotong. */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
          {alamat && (
            /* Tautan yang BERPENAMPILAN tombol, bukan tombol yang menavigasi.
               Ia berpindah halaman tanpa menulis apa pun, jadi ia pantas bisa
               dibuka di tab baru, ditekan lama, dan dibaca pembaca layar
               sebagai tujuan. */
            <Link
              href={alamat}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-slate-200"
            >
              Lihat detail
            </Link>
          )}

          {/* Tombolnya tidak selalu ada, dan ketiadaannya berarti sesuatu:
              tidak ada paket yang bisa dibuka DETIK INI. Langkah yang berupa
              ujian sengaja ikut ke sini — di sana ada cabang yang harus dipilih
              anak sendiri (pengayaan dulu, atau ujian yang lahir sekali tanpa
              putaran kedua), dan tombol "Kerjakan soal" yang melewatinya akan
              mengambil keputusan itu diam-diam atas namanya. */}
          {langsung && (
            <button
              type="button"
              disabled={sibuk}
              onClick={() => {
                setGalat(null)
                mulai(async () => {
                  const hasil = await mulaiLangkahTopik(anak, t.id)
                  if (hasil && 'error' in hasil) setGalat(hasil.error)
                })
              }}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {sibuk ? 'Menyiapkan soal…' : labelTombol(langkah)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Deretan keping paket: seluruh isi topik dalam satu baris selebar kartu.
 *
 * PERTANYAAN YANG DIJAWABNYA "aku sudah sampai mana" — dan sampai sebelum ini
 * kartu Misi tidak bisa menjawabnya sama sekali. Yang tampil cuma satu paket,
 * yang berikutnya, sehingga anak yang sudah melewati C1 dan C2 melihat layar
 * yang persis sama dengan anak yang belum menyentuh apa pun. Kemajuan yang
 * tidak terlihat adalah kemajuan yang tidak terasa.
 *
 * KODENYA IKUT DIGAMBAR, bukan cuma titik berwarna. Titik memberi tahu berapa
 * banyak; kode memberi tahu APA — dan tombol di bawah kartu berbunyi "Kerjakan
 * C4", kalimat yang cuma bisa dicocokkan dengan deretan ini kalau deretannya
 * menyebutkan C4.
 *
 * TIGA KELOMPOK DIPISAHKAN GARIS TIPIS: wajib, lalu pengayaan, lalu ujian.
 * Tanpa pemisah, C4 di sebelah C3 terbaca sebagai kelanjutan yang sama
 * wajibnya, dan anak yang menghitung "masih enam lagi" akan mengira topiknya
 * dua kali lebih panjang dari yang sebenarnya menahan ketuntasannya.
 *
 * LIMA KEADAAN, DAN TIDAK SATU PUN DIBEDAKAN OLEH WARNA SAJA:
 *
 *   hijau + centang   sudah lolos (untuk ujian: sudah dikerjakan).
 *   kuning + gembok   sedang terkunci, menunggu jedanya habis.
 *   biru bergaris     yang akan dibuka tombol di bawah. Satu-satunya per kartu.
 *   putih bergaris    boleh dikerjakan, belum lolos.
 *   abu polos         belum bisa dibuka sama sekali.
 *
 * Dua yang paling sering disalahbaca dapat ikon, bukan sekadar rona: "sudah"
 * dan "tertutup" adalah kabar yang paling menentukan apa yang anak lakukan
 * berikutnya, dan keduanya harus terbaca oleh yang tidak membedakan hijau dari
 * kuning — sekitar satu dari dua belas anak laki-laki.
 *
 * PUTIH BERGARIS BUKAN ABU, dan bedanya bukan selera. Paket pengayaan boleh
 * dikerjakan kapan saja lewat halaman topik; menggambarnya abu — rona yang di
 * seluruh aplikasi ini berarti "tidak bisa" — akan memagari anak dari sesuatu
 * yang sebenarnya terbuka, persis kebalikan dari prinsip "memberi tahu, bukan
 * memblokir" yang memandu seluruh peta ini. Abu disimpan untuk yang memang
 * benar-benar tertutup: ujian yang masih menunggu paket wajibnya tuntas.
 */
function DeretPaket({
  paket,
  sekarang,
}: {
  paket: PaketRingkas[]
  sekarang: string | null
}) {
  if (paket.length === 0) return null

  // Ujian menunggu selama masih ada paket wajib yang belum lolos (189).
  // Dihitung di sini, bukan diminta dari database: jawabannya sudah utuh ada di
  // deretan yang sedang digambar, dan kolom kesembilan untuk sesuatu yang bisa
  // dibaca dari delapan kolom lain adalah kolom yang harus dijaga tetap cocok.
  const wajibBelum = paket.some(p => p.jenis === 'latihan' && !p.pengayaan && !p.lolos)

  return (
    <span className="flex flex-wrap items-center gap-1">
      {paket.map((p, i) => {
        const sesudah = paket[i + 1]
        // Garis pemisah muncul di PERGANTIAN kelompok, jadi ia tidak perlu tahu
        // kelompok mana yang ada di topik ini. Topik tanpa pengayaan tidak
        // menggambar garis yang memisahkan ketiadaan dari ujian.
        //
        // Dilekatkan ke keping SEBELUM pergantian, bukan sesudahnya. Deret tujuh
        // keping tidak selalu muat satu baris, dan garis yang menempel di
        // depan keping berikutnya akan ikut turun bersamanya — berdiri sendiri
        // di awal baris kedua sebagai coretan yang tidak memisahkan apa pun.
        const pisah =
          sesudah != null && (sesudah.pengayaan !== p.pengayaan || sesudah.jenis !== p.jenis)
        const k = keadaanKeping(p, p.paketId === sekarang, wajibBelum)

        return (
          <span key={p.paketId} className="flex items-center gap-1">
            <span
              title={`${kodeRingkas(p)} — ${k.sebut}`}
              className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px] font-semibold ${k.kelas}`}
            >
              {k.ikon === 'lolos' && <IkonCentang />}
              {k.ikon === 'kunci' && <IkonGembok />}
              {k.ikon === 'gagal' && <IkonSilang />}
              {kodeRingkas(p)}
            </span>
            {pisah && <span className="h-3 w-px bg-slate-200" aria-hidden />}
          </span>
        )
      })}
    </span>
  )
}

interface KeadaanKeping {
  kelas: string
  ikon: 'lolos' | 'kunci' | 'gagal' | null
  /** Keadaannya dalam kata-kata, untuk `title` — dan untuk yang tidak melihat warna. */
  sebut: string
}

/**
 * Rupa sebuah keping. HASILNYA SELALU MENANG atas gilirannya.
 *
 * Paket yang gagal tetap merah seluruhnya — isi, garis, dan silangnya — walau ia
 * juga giliran berikutnya. Warna adalah satu-satunya saluran yang dipunyai
 * keping selebar dua digit, dan memberikannya kepada "giliran" berarti
 * mengambilnya dari "hasil": anak yang baru saja tidak lolos C1 lalu melihat C1
 * bergaris biru seperti paket yang belum pernah ia sentuh berhak bingung. Yang
 * berikutnya toh sudah disebutkan tombol di bawah kartu, lengkap dengan kata
 * kerjanya — "Ulangi C1".
 *
 * Biru karenanya cuma dipakai di satu tempat: paket yang belum punya cerita apa
 * pun. Di sana ia tidak menimpa kabar siapa-siapa, dan ia cuma GARIS — isinya
 * tetap putih seperti tetangganya, karena yang dibedakan giliran, bukan
 * keadaan.
 *
 * URUTAN PEMERIKSAAN ISINYA ADALAH ATURANNYA:
 *
 *   lolos       Mendahului segalanya. Paket yang sudah dilewati memang selalu
 *               berkunci — itu mekanisme 183, bukan halangan — jadi
 *               menggambarnya bergembok mengabarkan hambatan yang tidak ada.
 *
 *   belum lolos Merah bersilang: pernah dikerjakan, nilainya di bawah ambang.
 *               Ini keadaan yang paling perlu dibedakan dari "belum disentuh",
 *               dan sebelum ini keduanya sama-sama putih bergaris.
 *
 *               Kalau ia sekaligus sedang terkunci, warnanya TETAP merah dan
 *               ikonnya yang berganti gembok. Warna menjawab "bagaimana
 *               hasilnya", ikon menjawab "bisa dibuka sekarang atau tidak" —
 *               dua kabar, dua saluran, satu keping.
 *
 *   terkunci    Kuning bergembok, untuk yang terkunci tanpa pernah dikerjakan.
 *
 *   menunggu    Abu polos: ujian yang paket wajibnya belum tuntas. Satu-satunya
 *               yang benar-benar tidak bisa dibuka — sebab itu satu-satunya
 *               yang abu.
 *
 *   sisanya     Putih bergaris: boleh dikerjakan, belum disentuh — garisnya
 *               biru kalau ia giliran berikutnya. BUKAN abu, karena rona itu di
 *               seluruh aplikasi ini berarti "tidak bisa", dan paket pengayaan
 *               sebenarnya terbuka kapan saja.
 */
function keadaanKeping(
  p: PaketRingkas,
  sekarang: boolean,
  wajibBelum: boolean
): KeadaanKeping {
  const r = rona(p, sekarang, wajibBelum)
  return {
    kelas: `${r.isi} ${r.garis}`,
    ikon: r.ikon,
    // Gilirannya tetap dikatakan, cuma tidak lagi lewat warna: yang tidak
    // membedakan rona sekali pun tahu keping mana yang berikutnya.
    sebut: sekarang ? `${r.sebut} — berikutnya` : r.sebut,
  }
}

function rona(
  p: PaketRingkas,
  sekarang: boolean,
  wajibBelum: boolean
): { isi: string; garis: string; ikon: KeadaanKeping['ikon']; sebut: string } {
  if (p.lolos) {
    return {
      isi: 'bg-emerald-50 text-emerald-700',
      garis: 'border-emerald-200',
      ikon: 'lolos',
      sebut: p.jenis === 'ujian' ? 'sudah dikerjakan' : 'sudah lolos',
    }
  }
  if (p.pernahDikerjakan) {
    return {
      isi: 'bg-red-50 text-red-700',
      garis: 'border-red-200',
      ikon: p.terkunci ? 'kunci' : 'gagal',
      sebut: p.terkunci
        ? 'belum lolos, sedang terkunci'
        : 'sudah dicoba, belum lolos',
    }
  }
  if (p.terkunci) {
    return {
      isi: 'bg-amber-50 text-amber-700',
      garis: 'border-amber-200',
      ikon: 'kunci',
      // Ujian yang terkunci bukan menunggu jeda melainkan sudah terpakai (189),
      // dan tidak ada jam yang boleh dijanjikan untuknya.
      sebut: p.jenis === 'ujian' ? 'sudah terpakai' : 'sedang terkunci',
    }
  }
  if (p.jenis === 'ujian' && wajibBelum) {
    return {
      isi: 'bg-slate-100 text-gray-400',
      garis: 'border-transparent',
      ikon: null,
      sebut: 'menunggu paket wajibnya tuntas',
    }
  }
  return {
    isi: sekarang ? 'bg-white text-blue-700' : 'bg-white text-gray-600',
    garis: sekarang ? 'border-blue-500' : 'border-slate-200',
    ikon: null,
    sebut: p.pengayaan ? 'pengayaan, belum dikerjakan' : 'belum dikerjakan',
  }
}

/**
 * Dua ikon sebesar huruf di sebelahnya.
 *
 * Digambar langsung sebagai SVG, bukan diambil dari pustaka ikon: keduanya cuma
 * beberapa garis, dan sebuah paket ikon yang ditarik demi dua bentuk sepuluh
 * piksel adalah puluhan kilobita yang diunduh tiap anak yang membuka Misi.
 *
 * `aria-hidden` karena keadaannya sudah tertulis di `title` kepingnya — ikon
 * yang ikut dibacakan pembaca layar cuma menambah satu kata tanpa arti di
 * tengah kalimat yang sudah lengkap.
 */
function IkonCentang() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
      <path
        d="M2.5 6.5 5 9l4.5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IkonSilang() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
      <path
        d="m3.2 3.2 5.6 5.6M8.8 3.2 3.2 8.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IkonGembok() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
      <path
        d="M4 5V3.5a2 2 0 1 1 4 0V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="2.6" y="5" width="6.8" height="5" rx="1.2" fill="currentColor" />
    </svg>
  )
}

/**
 * Kata di atas tombol: kata kerjanya, lalu paketnya.
 *
 * "Ulangi C1", bukan "Kerjakan C1", untuk paket yang sudah pernah ditutup anak.
 * Langkah yang menunjuk paket yang baru saja ia kerjakan berarti paket itu
 * belum lolos ambang — dan tombol yang tetap berkata "Kerjakan C1" pada anak
 * yang baru menutup C1 terbaca seperti aplikasi yang tidak mengikuti apa yang
 * barusan terjadi. Kepingnya di atas sudah merah bersilang; kata kerjanya
 * mestinya bercerita hal yang sama.
 *
 * `pernahDikerjakan` menghitung putaran yang SELESAI saja (191), jadi paket yang
 * cuma dibuka lalu ditinggalkan tetap berbunyi "Kerjakan" — dan memang begitu
 * seharusnya: tidak ada yang perlu diulang dari sesuatu yang belum pernah
 * dikerjakan.
 */
function labelTombol(langkah?: LangkahTopik): string {
  return `${langkah?.pernahDikerjakan ? 'Ulangi' : 'Kerjakan'} ${kodeLangkah(langkah)}`
}

/** Kode pendek sebuah keping — "C1", "C4", "Ujian". */
function kodeRingkas(p: PaketRingkas): string {
  return kodePaket({ jenis: p.jenis, levelBloom: p.levelBloom, nomor: p.nomor })
}

/**
 * Kode paket langkah berikutnya — "C1", "C4", "Ujian".
 *
 * Dipakai tombol dan baris keterangan, dari satu tempat. Tombol yang berkata
 * "Kerjakan C4" sementara barisnya menyebut C3 bukan cuma membingungkan; ia
 * membuat anak curiga pada seluruh layar.
 */
function kodeLangkah(langkah?: LangkahTopik): string {
  if (!langkah || !langkah.paketId) return 'soal'
  return kodePaket({
    jenis: langkah.jenis === 'ujian' ? 'ujian' : 'latihan',
    levelBloom: langkah.levelBloom,
    nomor: langkah.levelBloom ?? 1,
  })
}

/**
 * Satu baris keterangan kartu — yang bisa berubah besok, bukan sifat tetap
 * topiknya. Tema dan jumlah paketnya tinggal di kepala kartu.
 *
 * String kosong berarti tidak ada yang perlu dikatakan, dan pemanggilnya tidak
 * menggambar barisnya sama sekali. Itu keadaan yang paling umum: topik yang
 * langkahnya siap dikerjakan sudah diceritakan tombol dan deret kepingnya.
 *
 * ATURANNYA: sebut yang tidak dikatakan tempat lain, diamkan sisanya. Kartu
 * yang mengulang isi tombolnya sendiri terbaca dua kali untuk informasi yang
 * satu, dan ongkosnya dibayar tiap baris di layar yang isinya sembilan belas
 * topik.
 *
 * Karena itu paket yang siap dikerjakan TIDAK disebut di sini sama sekali —
 * tombol "Kerjakan C1" di bawahnya sudah menyebutnya, lengkap dengan kata
 * kerjanya. Yang disebut justru yang TIDAK punya tombol atau yang tombolnya
 * tidak bisa menjelaskan dirinya sendiri:
 *
 *   terkunci   Tombolnya memang tidak ada, jadi tanpa baris ini kartunya diam
 *              soal kenapa. Dan yang disebut KAPAN ia terbuka, bukan sekadar
 *              bahwa ia terkunci: "Besok, 12.57" mengakhiri pertanyaannya,
 *              "sedang terkunci" cuma memindahkannya ke halaman lain.
 *
 *   ujian      Tombolnya berbunyi "Kerjakan Ujian" tanpa mengatakan bahwa itu
 *              berarti seluruh paket wajibnya sudah lolos — kabar baik yang
 *              sedang dirayakan anak, dan satu-satunya tempatnya di kartu ini.
 *
 *   habis      Tidak ada tombol, tidak ada langkah. Barisnya yang mengabarkan.
 *
 * Jadwal pengecekan ulang ikut di sini dengan alasan yang sama: ia cuma muncul
 * untuk topik tuntas, yang tidak punya kabar lain untuk ditumpuk.
 */
function ringkasKartu(
  t: TopikPeta,
  langkah: LangkahTopik | undefined,
  paket: PaketRingkas[],
  hariIni: string
): string {
  // Tema dan jumlah paket TIDAK lagi di sini — keduanya pindah ke kepala kartu,
  // di bawah kodenya. Yang tinggal cuma kabar yang bisa berubah besok.
  const bagian: string[] = []

  // Yang terkunci dicari di SELURUH paket, bukan cuma di paket yang ditawarkan.
  // Sejak 193 keduanya bisa berbeda: selama paket wajib tertutup, alurnya
  // menawarkan pengayaan. Kalau kabar terkunci ikut pindah ke paket yang
  // ditawarkan, kartu justru berhenti menyebutkannya tepat pada keadaan yang
  // paling perlu dijelaskan — tombol yang tiba-tiba berbunyi "Kerjakan C4"
  // padahal anak baru saja mengerjakan C3.
  const tertutup = paket.find(p => p.terkunci && p.bukaPada)

  if (langkah && !langkah.paketId) {
    bagian.push('semua paket selesai')
  } else if (tertutup) {
    const w = labelSesiWib(tertutup.bukaPada!, hariIni)
    bagian.push(`${kodeRingkas(tertutup)} terbuka ${w.hari.toLowerCase()} ${w.jam}`)
  } else if (langkah?.terkunci) {
    // Terkunci tanpa waktu buka: itu paket UJIAN, yang kuncinya permanen (183).
    // Tidak ada jam yang boleh dijanjikan, jadi yang disebut cuma keadaannya.
    bagian.push(`${kodeLangkah(langkah)} terkunci`)
  } else if (langkah?.jenis === 'ujian') {
    bagian.push('paket wajibnya tuntas')
  }

  // Ditulis sebagai kabar, bukan tenggat: dokumen Retest Terjadwal Bagian 4.3
  // melarang penalti keterlambatan, jadi tidak ada hitung mundur dan tidak ada
  // kata "harus". Yang perlu diketahui anak yang sudah menuntaskan sebuah topik
  // cuma bahwa urusannya belum selesai selamanya.
  if (t.status === 'tuntas' && t.retestBerikutnya) {
    bagian.push(`dicek ulang ${tanggalPendek(t.retestBerikutnya)}`)
  }

  return bagian.join(' · ')
}

/**
 * Enam keadaan FR13, dan cuma dua yang berlabel.
 *
 * Sebuah label status berhak berdiri di kartu ini kalau ia mengabarkan sesuatu
 * yang TIDAK dikatakan bagian lain kartunya. Sejak deret keping dan tombolnya
 * masuk, syarat itu tidak lagi dipenuhi oleh empat dari enam keadaan:
 *
 *   `sedang_dikerjakan`  Dikabarkan deret kepingnya, jauh lebih tepat. Label
 *                        ini cuma bilang "ada yang sedang berjalan"; kepingnya
 *                        menunjukkan paket yang mana, mana yang sudah lolos,
 *                        dan tombolnya menyebutkan apa yang dibuka berikutnya.
 *                        Yang umum berdiri di sebelah yang persis membuat yang
 *                        persis lebih lambat dibaca.
 *
 *   `butuh_pengulangan`  Sama: keping ambar bergembok dan baris "C3 terbuka
 *                        besok 12.57" sudah menceritakan seluruhnya. "Ayo coba
 *                        lagi" di atasnya menambah satu kotak berwarna yang
 *                        menyuruh anak melakukan sesuatu yang justru sedang
 *                        tidak bisa ia lakukan.
 *
 *   `terkunci`           Topiknya tetap bisa diketuk dan dikerjakan (lihat
 *                        catatan prasyarat di kepala berkas), jadi kata
 *                        "terkunci" di layar anak berbohong tentang pintu yang
 *                        sebenarnya terbuka.
 *
 *   `siap_dikerjakan`    Barisnya cuma muncul di bawah judul "Siap untuk kamu
 *                        sekarang". Label yang mengulang judul kelompoknya
 *                        sendiri tidak menambahkan apa pun.
 *
 * Status null juga tidak berlabel — itu topik yang belum pernah disentuh, dan
 * cetakan statusnya memang belum ditulis.
 *
 * YANG TERSISA DUA, dan keduanya bertahan karena tidak punya wakil di tempat
 * lain: `tuntas` adalah putusan tentang SELURUH topik yang tidak bisa dibaca
 * dari deret keping mana pun (paket bisa habis tanpa topiknya tuntas), dan
 * `eskalasi_tutor` mengabarkan sesuatu yang terjadi di luar layar ini — seorang
 * manusia akan duduk bersamanya.
 *
 * Kalimatnya sendiri ditulis untuk anak, bukan tutornya: "Tutor akan membantu"
 * berbunyi seperti pengumuman tentang dirinya yang dibuat di belakangnya,
 * sedangkan "Dibahas bareng tutor" menyebut apa yang akan terjadi.
 */
function LabelStatus({ status }: { status: string | null }) {
  const label: Record<string, { teks: string; kelas: string }> = {
    tuntas: { teks: 'Tuntas', kelas: 'bg-emerald-50 text-emerald-700' },
    eskalasi_tutor: { teks: 'Dibahas bareng tutor', kelas: 'bg-violet-50 text-violet-700' },
  }
  const l = status ? label[status] : undefined
  if (!l) return null
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${l.kelas}`}>
      {l.teks}
    </span>
  )
}

/**
 * "16 September" dari "2026-09-16".
 *
 * Dirakit sendiri alih-alih memakai `toLocaleDateString`: komponen ini dirender
 * di server DAN di browser, dan keduanya tidak dijamin punya locale yang sama —
 * beda satu huruf saja sudah cukup untuk melahirkan ketidakcocokan hidrasi.
 */
function tanggalPendek(iso: string): string {
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const [, b, h] = iso.split('-')
  return `${Number(h)} ${bulan[Number(b) - 1] ?? ''}`.trim()
}
