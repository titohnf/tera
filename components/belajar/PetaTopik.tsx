'use client'

import { useMemo, useState } from 'react'
import type { PaketPeta, TopikPeta } from '@/lib/belajar/topik-peta'
import { kelompokkanPeta, sebutPrasyarat } from '@/lib/belajar/fringe'
import DaftarPaket from './DaftarPaket'
import KartuPenempatan from './KartuPenempatan'

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
 * DAFTARNYA DATANG DARI SERVER, bukan dijemput sendiri sesudah komponennya
 * hidup. Versi pertama memanggil `muatPeta()` di dalam `useEffect`, dan itu
 * punya dua akibat yang cuma kelihatan setelah dipakai: petanya baru muncul
 * satu perjalanan jaringan sesudah sisa halaman — sering terbaca sebagai "harus
 * dimuat ulang dulu baru muncul" — dan setiap kegagalan panggilan berakhir
 * sebagai layar yang diam, karena tidak adanya topik dan gagalnya pertanyaan
 * menghasilkan tampilan yang sama persis: tidak ada apa-apa.
 *
 * Halaman Misi sudah tahu atas nama siapa ia dibuka, jadi ia pula yang
 * bertanya. Yang tersisa di browser cuma yang memang milik browser: topik mana
 * yang sedang dibentangkan, dan kelompok mana yang sedang dibuka.
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
  paketAwal,
  hariIniWib,
}: {
  anak: string | undefined
  topik: TopikPeta[]
  /** Paket topik yang terbentang sejak awal, dibawa server bersama halamannya. */
  paketAwal?: PaketPeta[]
  /**
   * Hari ini dalam WIB (`YYYY-MM-DD`), dari server.
   *
   * Diberikan, bukan dibaca sendiri di browser: "besok pukul 09.56" dirender
   * dua kali — sekali di server, sekali saat hidrasi — dan jam yang dibaca
   * masing-masing akan berbeda. Pola yang sama dengan `labelSesiWib`, yang juga
   * menolak membaca jamnya sendiri.
   */
  hariIniWib: string
}) {
  const { siap, belum, tuntas } = useMemo(() => kelompokkanPeta(topik), [topik])

  // Kode topik ke namanya, untuk keterangan prasyarat. Seluruh topik ikut,
  // bukan cuma yang terlipat: prasyarat sebuah topik di `belum` bisa saja topik
  // yang sedang berdiri di `siap`.
  const namaTopik = useMemo(() => new Map(topik.map(t => [t.id, t.nama])), [topik])

  // Satu topik saja: tidak ada yang perlu dipilih, jadi jangan menyuruh orang
  // mengetuk untuk membuka satu-satunya pintu yang ada.
  //
  // SATU-SATUNYA yang dibentangkan otomatis, dan frontier yang berisi lima
  // topik SENGAJA dibiarkan tertutup semua. Membentangkan yang teratas akan
  // mendorong empat sisanya ke bawah layar, dan dengan itu layar ini berubah
  // jadi versi satu-kartu — tepat bentuk yang graf prasyaratnya tidak
  // membenarkan.
  const [terbuka, setTerbuka] = useState<string | null>(
    topik.length === 1 ? topik[0].id : null
  )
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
      aktif={terbuka === t.id}
      onKetuk={() => setTerbuka(terbuka === t.id ? null : t.id)}
      namaTopik={namaTopik}
      awal={topik.length === 1 ? paketAwal : undefined}
      hariIniWib={hariIniWib}
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

/** Satu baris topik, beserta paketnya kalau sedang dibentangkan. */
function Baris({
  topik: t,
  anak,
  aktif,
  onKetuk,
  namaTopik,
  awal,
  hariIniWib,
}: {
  topik: TopikPeta
  anak: string | undefined
  aktif: boolean
  onKetuk: () => void
  namaTopik: Map<string, string>
  awal?: PaketPeta[]
  hariIniWib: string
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-kartu">
      <button
        type="button"
        onClick={onKetuk}
        aria-expanded={aktif}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
      >
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
          <span className="mt-0.5 block text-xs text-gray-400">{t.jumlahPaket} paket</span>
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
        </span>
        <span className="shrink-0 text-gray-300" aria-hidden>
          {aktif ? '▾' : '▸'}
        </span>
      </button>

      {/* TAWARAN LOMPAT KELUAR DARI AKORDEON. Tes penempatan dulu cuma terlihat
          SESUDAH topiknya dibentangkan — jadi satu-satunya jalan menemukan
          tawaran "kamu tidak perlu mengerjakan ini" adalah membuka daftar
          pekerjaan yang ia tawarkan untuk dilewati. Anak yang sudah menguasai
          topiknya justru yang paling tidak punya alasan mengetuk barisnya.
          Bilah ini yang mengabarkannya; rinciannya — delapan soal, sekali saja —
          tetap di `KartuPenempatan` di dalam, jadi tidak ada yang berlipat dua.
          Ia menghilang begitu topiknya terbentang, karena kartunya sudah
          berdiri di sana. */}
      {t.penempatanSiap && !aktif && (
        <button
          type="button"
          onClick={onKetuk}
          className="flex w-full items-center justify-between gap-2 border-t border-blue-100 bg-blue-50/70 px-4 py-2.5 text-left transition hover:bg-blue-100/70"
        >
          <span className="text-xs font-medium text-blue-800">
            Sudah bisa? Lewati bagian yang mudah dengan tes penempatan
          </span>
          <span className="shrink-0 text-xs text-blue-400" aria-hidden>
            →
          </span>
        </button>
      )}

      {aktif && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-3">
          {/* DI ATAS daftar paketnya, bukan di bawah: tawaran untuk TIDAK
              mengerjakan sebagian daftar itu hanya berguna kalau dibaca sebelum
              daftarnya dipilih. */}
          {t.penempatanSiap && <KartuPenempatan topikId={t.id} anak={anak} />}
          <DaftarPaket
            anak={anak}
            sumber={{ jenis: 'peta', topikId: t.id }}
            jumlahSoal={t.jumlahPaket * 8}
            awal={awal}
            levelDibebaskan={t.levelDibebaskan}
            hariIniWib={hariIniWib}
          />
        </div>
      )}
    </div>
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
