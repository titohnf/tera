'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { LangkahTopik } from '@/lib/belajar/langkah'
import { kelompokkanPeta, sebutPrasyarat } from '@/lib/belajar/fringe'
import { namaPaket } from '@/lib/belajar/nama-paket'
import { namaTema } from '@/lib/belajar/tema-topik'
import { mulaiLangkahTopik } from '@/app/belajar/actions'
import IkonTema from './IkonTema'

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
 * hampir selalu sama. Sekarang barisnya langsung membuka langkah berikutnya:
 * kunjungan pertama masuk ke soal tanpa perantara, kunjungan berikutnya mampir
 * di halaman topik yang menyebutkan paket mana yang akan dikerjakan.
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
}: {
  anak: string | undefined
  topik: TopikPeta[]
  /**
   * Langkah berikutnya tiap topik (migrasi 190), dibawa server bersama
   * halamannya. Topik yang tidak punya barisnya di sini tetap digambar — tanpa
   * indikator, dan ketukannya jatuh ke halaman topik seperti biasa.
   */
  langkah: LangkahTopik[]
}) {
  const { siap, belum, tuntas } = useMemo(() => kelompokkanPeta(topik), [topik])

  // Kode topik ke namanya, untuk keterangan prasyarat. Seluruh topik ikut,
  // bukan cuma yang terlipat: prasyarat sebuah topik di `belum` bisa saja topik
  // yang sedang berdiri di `siap`.
  const namaTopik = useMemo(() => new Map(topik.map(t => [t.id, t.nama])), [topik])
  const perTopik = useMemo(() => new Map(langkah.map(l => [l.topikId, l])), [langkah])

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
      namaTopik={namaTopik}
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
          <div className="space-y-2">{siap.map(baris)}</div>
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
        <div className="space-y-2">
          {keterangan && <p className="px-1 text-xs text-gray-400">{keterangan}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Satu baris topik, dan pintunya ke langkah berikutnya.
 *
 * DUA PERILAKU, SATU BARIS. Kunjungan pertama sebuah topik langsung membuka
 * sesi paket pertamanya; kunjungan berikutnya mendarat di halaman topik. Yang
 * membedakan bukan selera melainkan apa yang ada untuk dibaca: anak yang belum
 * pernah menyentuh topiknya tidak punya kemajuan untuk dilihat, dan halaman
 * yang cuma berkata "kamu akan mengerjakan Paket C1" adalah ketukan tambahan
 * yang tidak membayar dirinya sendiri. Yang sudah berjalan justru sebaliknya —
 * ia perlu tahu ia sampai di mana sebelum soal berikutnya muncul.
 *
 * Ketukan pertama itu MENULIS (sesi baru lahir), jadi ia tombol, bukan tautan.
 * Sisanya membaca, jadi tautan — dan tautan yang benar-benar tautan bisa
 * dibuka di tab baru, ditekan lama, dan dibaca pembaca layar sebagai tujuan.
 */
function Baris({
  topik: t,
  anak,
  langkah,
  namaTopik,
}: {
  topik: TopikPeta
  anak: string | undefined
  langkah?: LangkahTopik
  namaTopik: Map<string, string>
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  // Kunjungan pertama: tidak ada sesi selesai satu pun di topik ini, dan
  // langkahnya masih ada. Keduanya harus benar — topik yang paketnya sudah
  // habis tidak punya apa pun untuk dibuka.
  const langsung = langkah != null && !langkah.sudahMulai && langkah.paketId != null
  const alamat = anak ? `/keluarga/${anak}/misi/${t.id}` : null

  const isi = (
    <>
        {/* Ikon temanya, dan bukan ikon mapel: seluruh topik di peta ini
            Matematika, jadi ikon mapel akan menggambar sembilan belas lingkaran
            indigo yang sama persis — deretan yang tidak membedakan apa pun
            justru membuat baris lebih sulit dipindai daripada tanpa ikon sama
            sekali. Temanya yang berbeda, jadi temanya yang digambar. */}
        <IkonTema elemen={t.elemen} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* KODENYA IKUT TAMPIL. Keterangan prasyarat di bawah menyebut
                topik dengan kodenya ("D-01") di samping namanya, dan tanpa kode
                di baris ini anak harus mencocokkan nama panjang yang dua di
                antaranya berawal sama. */}
            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-500">
              {t.id}
            </span>
            <span className="min-w-0 text-sm font-semibold text-gray-900">{t.nama}</span>
            <LabelStatus status={t.status} />
          </span>
          {/* Tema mendahului jumlah paket: yang pertama menjawab "ini tentang
              apa", yang kedua "seberapa panjang". Anak yang membuka peta
              mencari yang pertama. */}
          <span className="mt-0.5 block text-xs text-gray-400">
            {namaTema(t.elemen)} · {t.jumlahPaket} paket
          </span>
          {!t.prasyaratTerpenuhi && t.status !== 'tuntas' && (
            // Kalimatnya sengaja tidak melarang. Yang disampaikan sebuah saran
            // urutan, bukan pintu yang tertutup.
            //
            // Dan tidak disampaikan sama sekali kalau topiknya sudah TUNTAS:
            // sarannya berbunyi "lebih mudah kalau X dulu", sedangkan anak ini
            // sudah menuntaskannya tanpa X. Saran untuk pekerjaan yang sudah
            // selesai bukan cuma mubazir — ia berdiri tepat di sebelah label
            // "Tuntas" dan membuat keduanya saling membantah.
            <span className="mt-1 block text-xs text-amber-700">
              Lebih mudah kalau {sebutPrasyarat(t.prasyaratKurang, namaTopik)} sudah
              dituntaskan dulu
            </span>
          )}
          {t.status === 'tuntas' && t.retestBerikutnya && (
            // KAPAN, bukan cuma BAHWA. Pengecekan ulang muncul sendiri pada
            // harinya sebagai kartu di atas peta; sebelum hari itu tidak ada
            // satu pun tempat yang menyebutkan ia akan datang. Anak yang
            // menuntaskan sebuah topik lalu tidak melihat apa-apa lagi wajar
            // mengira urusannya selesai selamanya.
            //
            // Ditulis sebagai kabar, bukan tenggat: dokumen Retest Terjadwal
            // Bagian 4.3 melarang penalti keterlambatan, jadi tidak ada hitung
            // mundur dan tidak ada kata "harus".
            <span className="mt-1 block text-xs text-gray-400">
              Dicek ulang sekitar {tanggalPendek(t.retestBerikutnya)}
            </span>
          )}
          {/* Langkahnya paling bawah, sesudah seluruh keterangan lain: ia yang
              menjelaskan apa yang akan terjadi kalau baris ini diketuk, dan
              kalimat tentang akibat pantas berdiri paling dekat dengan
              ketukannya. */}
          <Langkah langkah={langkah} />
        </span>
      <span className="shrink-0 text-gray-300" aria-hidden>
        ›
      </span>
    </>
  )

  const gaya =
    'flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-kartu transition hover:bg-slate-50'

  return (
    <div className="space-y-1.5">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {langsung || !alamat ? (
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
          className={`${gaya} disabled:opacity-60`}
        >
          {isi}
        </button>
      ) : (
        <Link href={alamat} className={gaya}>
          {isi}
        </Link>
      )}
    </div>
  )
}

/**
 * Satu kalimat: sekarang paket mana.
 *
 * MENYEBUT PAKETNYA, bukan cuma "lanjutkan". Anak yang membaca "Paket C2 —
 * Memahami" tahu apa yang akan ia hadapi sebelum mengetuk, dan itu yang
 * membedakan alur dari kotak kejutan. Nama paketnya dirakit `namaPaket`, sama
 * persis dengan yang tertulis di daftar paket — dua sebutan berbeda untuk paket
 * yang sama adalah cara tercepat membuat anak mengira ia salah tempat.
 */
function Langkah({ langkah }: { langkah?: LangkahTopik }) {
  if (!langkah) return null

  if (!langkah.paketId) {
    return (
      <span className="mt-1 block text-xs font-medium text-emerald-600">
        Semua paketnya sudah selesai
      </span>
    )
  }

  const nama = namaPaket({
    jenis: langkah.jenis === 'ujian' ? 'ujian' : 'latihan',
    levelBloom: langkah.levelBloom,
    nomor: langkah.levelBloom ?? 1,
  })

  // Terkunci bukan berarti buntu: paket latihan membuka sendiri sesudah
  // jedanya, dan kapan persisnya disebutkan halaman topik — layar yang punya
  // ruang untuk menyebutkan jam. Di sini cukup diketahui bahwa yang berikutnya
  // sedang menunggu, supaya anak tidak mengetuk lalu mendapat penolakan.
  if (langkah.terkunci) {
    return (
      <span className="mt-1 block text-xs text-gray-400">{nama} sedang terkunci</span>
    )
  }

  // "Ulangi", bukan "Lanjut", untuk paket yang sudah pernah ditutup anak.
  // Langkah yang menunjuk paket yang baru saja ia kerjakan berarti paket itu
  // belum lolos ambang — dan layar yang tetap berkata "Lanjut: Paket C1" pada
  // anak yang baru menutup Paket C1 terbaca seperti aplikasi yang tidak
  // mengikuti apa yang barusan terjadi.
  if (langkah.pernahDikerjakan) {
    return (
      <span className="mt-1 block text-xs font-medium text-amber-700">Ulangi: {nama}</span>
    )
  }

  return (
    <span className="mt-1 block text-xs font-medium text-blue-600">
      {langkah.sudahMulai ? `Lanjut: ${nama}` : `Mulai dari ${nama}`}
    </span>
  )
}

/**
 * Enam keadaan FR13 dalam satu label kecil.
 *
 * `terkunci` sengaja TIDAK punya label, dan itu bukan kelalaian: topiknya tetap
 * bisa diketuk dan dikerjakan (lihat catatan prasyarat di atas), jadi kata
 * "terkunci" di layar anak akan berbohong tentang pintu yang sebenarnya
 * terbuka. Yang perlu ia tahu sudah dikatakan keterangan prasyaratnya, dan
 * sekarang juga oleh lipatan tempat barisnya berada.
 *
 * `siap_dikerjakan` juga tidak lagi berlabel. Barisnya cuma pernah muncul di
 * bawah judul "Siap untuk kamu sekarang", dan sebuah label yang mengulang
 * judul kelompoknya sendiri tidak menambahkan apa pun selain kotak berwarna.
 *
 * Status null tidak berlabel — itu topik yang belum pernah disentuh, dan
 * cetakan statusnya memang belum ditulis.
 *
 * DUA LABEL DITULIS ULANG karena yang membacanya anak, bukan tutornya:
 *
 *   `butuh_pengulangan`  "Perlu diulang" mengabarkan sebuah putusan tentang
 *                        pekerjaannya. Yang sebenarnya terjadi adalah ia
 *                        mendapat kesempatan lagi — itu corrective loop, inti
 *                        mekanisme mastery learning, bukan hukumannya.
 *
 *   `eskalasi_tutor`     "Tutor akan membantu" berbunyi seperti pengumuman
 *                        tentang dirinya yang dibuat di belakangnya. Yang sama
 *                        benarnya dan tidak berbunyi begitu adalah menyebut apa
 *                        yang akan terjadi: seseorang duduk bersamanya.
 */
function LabelStatus({ status }: { status: string | null }) {
  const label: Record<string, { teks: string; kelas: string }> = {
    tuntas: { teks: 'Tuntas', kelas: 'bg-emerald-50 text-emerald-700' },
    sedang_dikerjakan: { teks: 'Sedang dikerjakan', kelas: 'bg-blue-50 text-blue-700' },
    butuh_pengulangan: { teks: 'Ayo coba lagi', kelas: 'bg-amber-50 text-amber-700' },
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
