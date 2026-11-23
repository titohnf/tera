'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { LangkahTopik, PaketRingkas } from '@/lib/belajar/langkah'
import { kelompokkanPeta } from '@/lib/belajar/fringe'
import { pilihTopikSekarang } from '@/lib/belajar/topik-sekarang'
import {
  Bintang,
  Centang,
  LencanaPangkat,
  TigaBintang,
} from '@/components/belajar/misi/Gambar'
import { hitungBintang, pangkatKelas } from '@/components/belajar/misi/gaya'
import { namaTemaAnak } from '@/lib/belajar/tema-topik'
import DaftarTopik from '@/components/belajar/misi/DaftarTopik'
import KartuMisiHariIni from '@/components/belajar/misi/KartuMisiHariIni'
import SheetTopik from '@/components/belajar/misi/SheetTopik'

/**
 * Peta kompetensi: topik yang boleh dikerjakan anak ini, berurut menurut
 * prasyarat — bukan menurut bab buku teks.
 *
 * Bedanya dengan pemilih bab bukan tampilan melainkan pertanyaannya: pemilih
 * lama bertanya "mau latihan bab yang mana", peta ini bertanya "kamu siap
 * belajar apa". Bab menyusul jadwal les dan berbeda antar program; kesiapan
 * tidak.
 *
 * RUPANYA UNTUK ANAK SD DI PONSEL: satu kartu "Misi hari ini" dengan satu tombol
 * besar, lalu jalur berkelok berisi simpul bergambar dan bintang, bukan daftar
 * kartu teks. Ketukan pada simpul membuka lembar rincian (`SheetTopik`) — di
 * sana tinggal semua yang dulu berdiri di badan kartu: deret level, kabar kunci,
 * prasyarat, dan dua tombolnya.
 *
 * TIGA KELOMPOK, BUKAN SATU DAFTAR RATA (`lib/belajar/fringe.ts` menjelaskan
 * pembagiannya dan mengapa "satu topik pada satu waktu" tidak bisa dibangun di
 * atas graf prasyarat ini). Yang siap dibentangkan sebagai jalur; yang sudah
 * tuntas jadi koleksi bintang; sisanya terlipat.
 *
 * PRASYARAT MEMBERI TAHU, BUKAN MEMBLOKIR. Topik yang prasyaratnya belum tuntas
 * tetap bisa diketuk, cuma disertai keterangan di lembarnya. Tanpa pengukuran
 * yang lengkap, satu-satunya yang sistem tahu adalah apa yang sudah pernah ia
 * ukur sendiri, dan mengunci anak dari topik yang mungkin sudah ia kuasai di
 * sekolah adalah menghukum orang atas kekurangan kita sendiri.
 *
 * DATANYA DATANG DARI SERVER (`IsiMisi`), bukan dijemput sendiri sesudah
 * komponennya hidup: versi yang menjemput di `useEffect` membuat petanya muncul
 * satu perjalanan jaringan sesudah halaman, dan kegagalan panggilan berakhir
 * sebagai layar yang diam. Yang tersisa di browser cuma yang memang milik
 * browser: lipatan mana yang terbuka dan topik mana yang sedang dilihat.
 */
export default function PetaTopik({
  anak,
  kelas,
  topik,
  langkah,
  paket,
  hariIni,
  topikBerMateri = [],
  bukaSekarang = false,
}: {
  anak: string | undefined
  /**
   * Kelas anak (1–12), atau null kalau belum diisi. Null berarti tidak ada
   * pemisahan jenjang sama sekali — lihat `diAtasKelas` di `fringe.ts`.
   */
  kelas: number | null
  topik: TopikPeta[]
  /**
   * Langkah berikutnya tiap topik (migrasi 190), dibawa server bersama
   * halamannya. Topik yang tidak punya barisnya di sini tetap digambar — tanpa
   * indikator, dan ketukannya jatuh ke halaman topik seperti biasa.
   */
  langkah: LangkahTopik[]
  /**
   * Keadaan tiap paket seluruh topik (194). Urutannya sudah urutan gambarnya
   * sejak dari database; komponen ini cuma mengelompokkannya per topik.
   */
  paket: PaketRingkas[]
  /**
   * Tanggal hari ini di WIB (`YYYY-MM-DD`), dibaca server dan diturunkan ke
   * sini — bukan dibaca sendiri saat render, karena jam server dan jam
   * perangkat tidak sama dan komponen ini dirender di kedua sisi
   * (`lib/waktu.ts`).
   */
  hariIni: string
  /** Kode topik yang punya materi interaktif (dihitung server; lihat `IsiMisi`). */
  topikBerMateri?: string[]
  /** Lembar rincian topik giliran sekarang langsung terbuka (pilih level), mis. dari hero beranda. */
  bukaSekarang?: boolean
}) {
  const { siap, diAtas, belum, tuntas } = useMemo(
    () => kelompokkanPeta(topik, kelas),
    [topik, kelas]
  )

  // Kode topik ke namanya, untuk keterangan prasyarat. Seluruh topik ikut, bukan
  // cuma yang terlipat: prasyarat sebuah topik di `belum` bisa saja topik yang
  // sedang berdiri di `siap`.
  const namaTopik = useMemo(() => new Map(topik.map(t => [t.id, t.nama])), [topik])
  const perTopik = useMemo(() => new Map(langkah.map(l => [l.topikId, l])), [langkah])

  // Dikelompokkan sekali untuk seluruh peta, bukan disaring ulang di tiap simpul.
  const paketTopik = useMemo(() => {
    const m = new Map<string, PaketRingkas[]>()
    for (const p of paket) {
      const ada = m.get(p.topikId)
      if (ada) ada.push(p)
      else m.set(p.topikId, [p])
    }
    return m
  }, [paket])

  // MISI HARI INI = topik pertama menurut urutan sistem yang bisa langsung
  // dikerjakan. Ini rute "Ikuti urutan", jadi tidak ada lompatan ke topik yang
  // kebetulan sudah dimulai: kalau ia memang yang pertama, ia terpilih sendiri.
  // Dipilih dari `siap` saja — tawaran utama tidak pernah topik yang
  // prasyaratnya belum lengkap atau yang di atas jenjang anak.
  const sekarang = useMemo(() => pilihTopikSekarang(topik, kelas, langkah), [topik, kelas, langkah])

  // Rute "Ikuti urutan" membentangkan SEMUA topik menurut urutan server, tanpa pembagian
  // siap / belum siap: yang bukan giliran sekarang cuma terkunci. Yang sudah tuntas TETAP di
  // jalurnya (bertanda centang, bisa diketuk lagi), tidak lagi dipindah ke koleksi: topik yang
  // lenyap dari jalur setelah selesai membuat anak kehilangan jejak dan tidak bisa mengulangnya.
  const urutanLengkap = topik

  // CHECKPOINT = kelas penguasaan (`kelasKuasai`), ukuran yang sama dengan "setara
  // kelas Y" di laporan orang tua, dan pangkatnya tidak pernah turun. Urutan server TIDAK
  // disusun ulang; yang dihitung hanya kelas checkpoint tiap topik: kelas
  // penguasaannya, atau kelas checkpoint sebelumnya kalau kelasnya lebih rendah.
  // Contoh nyata: topik penutup "Trigonometri lanjut…" berkelas 11 tapi urutannya
  // sesudah topik kelas 12 — tanpa ini checkpoint Jenderal muncul lagi sesudah
  // Legenda. Topik tanpa kelas berdiri sendiri sebagai "Misi Bonus".
  const kelasCheckpoint = useMemo(() => {
    const m = new Map<string, number | null>()
    let tertinggi = 0
    for (const t of topik) {
      if (t.kelasKuasai == null) {
        m.set(t.id, null)
        continue
      }
      tertinggi = Math.max(tertinggi, t.kelasKuasai)
      m.set(t.id, tertinggi)
    }
    return m
  }, [topik])

  const checkpoint = useMemo(() => {
    const hasil: { kelas: number | null; topik: TopikPeta[]; awal: number }[] = []
    urutanLengkap.forEach((t, i) => {
      const kelas = kelasCheckpoint.get(t.id) ?? null
      const akhir = hasil[hasil.length - 1]
      if (akhir && akhir.kelas === kelas) akhir.topik.push(t)
      else hasil.push({ kelas, topik: [t], awal: i })
    })
    return hasil.map(c => {
      const semua = topik.filter(t => (kelasCheckpoint.get(t.id) ?? null) === c.kelas)
      return { ...c, tuntas: semua.filter(t => t.status === 'tuntas').length, total: semua.length }
    })
  }, [urutanLengkap, topik, kelasCheckpoint])

  const totalBintang = useMemo(
    () => topik.reduce((n, t) => n + hitungBintang(t, paketTopik.get(t.id) ?? []), 0),
    [topik, paketTopik]
  )

  const [rute, setRute] = useState<'urutan' | 'bebas'>('urutan')
  // Checkpoint yang sengaja dibuka anak; yang aktif selalu terbuka sendiri.
  const [cpTerbuka, setCpTerbuka] = useState<Set<string>>(new Set())
  const [cari, setCari] = useState('')
  const [dibuka, setDibuka] = useState<TopikPeta | null>(bukaSekarang ? sekarang : null)
  const [lihatDiAtas, setLihatDiAtas] = useState(false)
  const [lihatBelum, setLihatBelum] = useState(false)
  const [lihatTuntas, setLihatTuntas] = useState(false)

  // Tidak ada topik berisi: layar ini tidak punya apa pun untuk ditawarkan, dan
  // yang benar adalah tidak muncul sama sekali — bukan kerangka kosong yang
  // terbaca seperti aplikasi rusak.
  if (topik.length === 0) return null

  // Tanpa topik siap sakelar rute tidak muncul, dan lipatan harus tetap terjangkau.
  const tampilLipatan = rute === 'bebas' || siap.length === 0

  // Pencarian hanya di rute "Pilih sendiri", dan menyaring SEMUA kelompok (siap,
  // koleksi, jenjang atas, belum siap) — anak yang mengetik nama topik tidak perlu
  // tahu topik itu ada di lipatan mana. Cocok pada nama, kode, atau nama tema.
  const kata = rute === 'bebas' ? cari.trim().toLowerCase() : ''
  const saring = (d: TopikPeta[]) =>
    kata
      ? d.filter(t => `${t.nama} ${t.id} ${namaTemaAnak(t.elemen)}`.toLowerCase().includes(kata))
      : d
  const siapTampil = saring(siap)
  const tuntasTampil = saring(tuntas)
  const diAtasTampil = saring(diAtas)
  const belumTampil = saring(belum)
  const adaHasil =
    siapTampil.length + tuntasTampil.length + diAtasTampil.length + belumTampil.length > 0

  const persen = Math.round((tuntas.length / topik.length) * 100)

  const kisi = (daftar: TopikPeta[]) => (
    <div className="grid grid-cols-2 gap-3">
      {daftar.map(t => (
        <Kisi
          key={t.id}
          topik={t}
          bintang={hitungBintang(t, paketTopik.get(t.id) ?? [])}
          onKetuk={() => setDibuka(t)}
        />
      ))}
    </div>
  )

  return (
    <section
      className="space-y-6"
      style={{ fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif' }}
    >
      {/* PERJALANANMU: dua angka dan satu batang. Bintang dan topik tuntas adalah
          satu-satunya "skor" di layar ini, dan keduanya cuma bertambah — tidak
          ada yang turun karena satu paket gagal. */}
      <div className="rounded-3xl bg-white p-4 shadow-kartu">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-2 text-base font-extrabold text-amber-700">
            <Bintang menyala ukuran={22} />
            {totalBintang}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-2 text-base font-extrabold text-emerald-700">
            <Centang ukuran={18} />
            {tuntas.length} tuntas
          </span>
          <span className="ml-auto text-sm font-bold text-slate-400">
            dari {topik.length} topik
          </span>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={persen}
          aria-label="Topik yang sudah tuntas"
        >
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${Math.max(persen, tuntas.length > 0 ? 4 : 0)}%`,
              background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
            }}
          />
        </div>
      </div>

      {siap.length > 0 && (
        <div
          role="group"
          aria-label="Cara memilih topik"
          className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1"
        >
          {(
            [
              ['urutan', 'Ikuti urutan'],
              ['bebas', 'Pilih sendiri'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={rute === k}
              onClick={() => setRute(k)}
              className={`rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${
                rute === k ? 'bg-white text-slate-900 shadow-kartu' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {rute === 'urutan' && sekarang && (
        <KartuMisiHariIni
          topik={sekarang}
          langkah={perTopik.get(sekarang.id)}
          paket={paketTopik.get(sekarang.id) ?? []}
          anak={anak}
          hariIni={hariIni}
          adaMateri={topikBerMateri.includes(sekarang.id)}
        />
      )}

      {siap.length > 0 && (
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            {rute === 'urutan' ? 'Jalur petualanganmu' : 'Pilih topikmu'}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {rute === 'urutan'
              ? 'Selesaikan misi yang menyala untuk membuka misi berikutnya, dan kumpulkan semua bintangnya!'
              : 'Mau mulai dari mana saja boleh. Ketik untuk mencari topik.'}
          </p>
          {rute === 'bebas' && (
            <div className="relative mt-3">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={cari}
                onChange={e => setCari(e.target.value)}
                placeholder="Cari topik…"
                aria-label="Cari topik"
                className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-base font-semibold text-slate-800 shadow-kartu outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-amber-300"
              />
            </div>
          )}
          {kata && !adaHasil && (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-kartu">
              Tidak ada topik yang cocok dengan &ldquo;{cari.trim()}&rdquo;.
            </p>
          )}
          {rute === 'urutan' ? (
            <div className="mt-4 space-y-5">
              {checkpoint.map(c => {
                const aktif = c.topik.some(t => t.id === sekarang?.id)
                const kunciCp = `${c.kelas}-${c.awal}`
                const terbuka = aktif || cpTerbuka.has(kunciCp)
                return (
                  <div key={kunciCp}>
                    {/* Hanya checkpoint aktif yang terbuka sendiri; yang lain terlipat
                        supaya jalurnya pendek, tapi masih bisa diintip. */}
                    <button
                      type="button"
                      disabled={aktif}
                      aria-expanded={terbuka}
                      onClick={() =>
                        setCpTerbuka(prev => {
                          const n = new Set(prev)
                          if (n.has(kunciCp)) n.delete(kunciCp)
                          else n.add(kunciCp)
                          return n
                        })
                      }
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${
                        terbuka ? 'mb-2' : ''
                      } ${aktif ? 'bg-amber-400 text-amber-950' : 'bg-slate-200/70 text-slate-600 transition active:bg-slate-200'}`}
                    >
                      <LencanaPangkat kelas={c.kelas} ukuran={52} redup={!aktif} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                          {c.kelas != null && c.kelas >= 1 && c.kelas <= 12
                            ? `Rank ${c.kelas}`
                            : 'Checkpoint'}
                        </span>
                        <span className="block text-base font-extrabold leading-tight">
                          {pangkatKelas(c.kelas)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-extrabold">
                        {c.tuntas}/{c.total} tuntas
                      </span>
                      {!aktif && (
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${terbuka ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      )}
                    </button>
                    {terbuka && (
                      <DaftarTopik
                        topik={c.topik}
                        paketTopik={paketTopik}
                        sekarangId={sekarang?.id ?? null}
                        kunci
                        nomorAwal={c.awal}
                        onBuka={setDibuka}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-4">
              <DaftarTopik
                topik={siapTampil}
                paketTopik={paketTopik}
                sekarangId={null}
                bernomor={false}
                onBuka={setDibuka}
              />
            </div>
          )}
        </div>
      )}

      {/* Frontier kosong sementara masih ada topik yang belum tuntas: keadaan yang
          wajar di awal, bukan galat. Kalimatnya menunjuk ke lipatan di bawah
          alih-alih membiarkan layar tampak habis. */}
      {siap.length === 0 && diAtas.length === 0 && belum.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-kartu">
          <p className="text-base font-extrabold text-slate-900">Belum ada yang terbuka</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Topik yang prasyaratnya sudah kamu lewati belum ada. Kamu tetap boleh membuka topik mana
            pun dari daftar di bawah.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Lipatan
          judul="Koleksi bintangmu"
          jumlah={rute === 'urutan' ? 0 : tuntasTampil.length}
          terbuka={lihatTuntas || kata !== ''}
          onKetuk={() => setLihatTuntas(!lihatTuntas)}
        >
          {kisi(tuntasTampil)}
        </Lipatan>

        {/* DI ATAS JENJANG ANAK, dan terlipat. Kalimatnya menerangkan TOPIKNYA
            ("biasanya dipelajari di kelas 7"), bukan anaknya: pembandingan
            dengan anak lain adalah yang membuat orang merasa kecil. */}
        <Lipatan
          judul="Untuk jenjang di atasmu"
          jumlah={tampilLipatan ? diAtasTampil.length : 0}
          terbuka={lihatDiAtas || kata !== ''}
          onKetuk={() => setLihatDiAtas(!lihatDiAtas)}
          keterangan={`Biasanya dipelajari di kelas ${Math.min(...diAtas.map(t => t.kelasMulai ?? 99))} ke atas. Kalau terasa sulit, itu wajar. Kamu boleh mencoba, atau kembali ke topik yang pas untuk kelasmu.`}
        >
          {kisi(diAtasTampil)}
        </Lipatan>

        <Lipatan
          judul="Belum siap"
          jumlah={tampilLipatan ? belumTampil.length : 0}
          terbuka={lihatBelum || kata !== ''}
          onKetuk={() => setLihatBelum(!lihatBelum)}
          /* Kalimat pembuka lipatan, bukan sesudahnya: yang membukanya perlu
             membaca lebih dulu bahwa isinya boleh dikerjakan. */
          keterangan="Prasyaratnya belum tuntas, tapi kamu tetap boleh mengerjakannya."
        >
          {kisi(belumTampil)}
        </Lipatan>
      </div>

      <SheetTopik
        topik={dibuka}
        langkah={dibuka ? perTopik.get(dibuka.id) : undefined}
        paket={dibuka ? (paketTopik.get(dibuka.id) ?? []) : []}
        namaTopik={namaTopik}
        kelas={kelas}
        anak={anak}
        hariIni={hariIni}
        onTutup={() => {
          setDibuka(null)
          // `?buka=sekarang` cukup sekali: tanpa dibuang, muat ulang akan membuka lembarnya lagi.
          if (bukaSekarang && typeof window !== 'undefined') {
            const u = new URL(window.location.href)
            u.searchParams.delete('buka')
            window.history.replaceState(window.history.state, '', u)
          }
        }}
      />
    </section>
  )
}

/**
 * Satu kelompok terlipat. Tidak dirender sama sekali kalau isinya kosong —
 * "Koleksi bintangmu (0)" adalah baris yang mengabarkan ketiadaan, dan anak yang
 * baru mulai akan membacanya sebagai layar yang rusak.
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
    <div className="space-y-3">
      <button
        type="button"
        onClick={onKetuk}
        aria-expanded={terbuka}
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-kartu transition active:bg-slate-50"
      >
        <span className="text-base font-extrabold text-slate-800">{judul}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-500">
          {jumlah}
        </span>
        <svg
          viewBox="0 0 12 12"
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${terbuka ? 'rotate-180' : ''}`}
          fill="none"
          aria-hidden
        >
          <path
            d="m2.5 4.5 3.5 3.5 3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {terbuka && (
        <div className="space-y-3">
          {keterangan && <p className="px-1 text-sm text-slate-500">{keterangan}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Ubin kecil untuk topik di luar jalur utama. Sudah tuntas: berbingkai emas
 * dengan centang. Lainnya: warna temanya dipudarkan — "boleh dicoba", bukan
 * "terkunci", karena rona abu di seluruh aplikasi ini berarti tidak bisa.
 */
function Kisi({
  topik: t,
  bintang,
  onKetuk,
}: {
  topik: TopikPeta
  bintang: number
  onKetuk: () => void
}) {
  const selesai = t.status === 'tuntas'
  return (
    <button
      type="button"
      onClick={onKetuk}
      aria-label={`${t.nama}, ${bintang} dari 3 bintang`}
      className="flex min-h-[132px] flex-col items-start gap-2 rounded-2xl bg-white p-3.5 text-left shadow-kartu transition active:scale-[0.98]"
      style={selesai ? { boxShadow: '0 0 0 2px #FBBF24' } : undefined}
    >
      {selesai && (
        <span className="flex w-full justify-end">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Centang ukuran={14} />
          </span>
        </span>
      )}
      <span className="line-clamp-3 text-sm font-extrabold leading-snug text-slate-800">
        {t.nama}
      </span>
      <span className="mt-auto">
        <TigaBintang jumlah={bintang} ukuran={16} />
      </span>
    </button>
  )
}
