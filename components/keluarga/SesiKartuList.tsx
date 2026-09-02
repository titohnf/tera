'use client'

import { useState } from 'react'
import { KEHADIRAN, sorotBaris } from '@/lib/kehadiran'
import SaringSheet from '@/components/keluarga/SaringSheet'

/**
 * Daftar sesi versi ponsel untuk portal keluarga — satu sesi satu kartu.
 *
 * Kartu-kartunya berdiri langsung di atas latar halaman, tanpa kartu pembungkus
 * lagi: dua lapis kotak bersarang cuma menyempitkan isinya dua kali dan tidak
 * mengelompokkan apa pun yang belum dikelompokkan pemisah bulan.
 *
 * `JadwalTable` tetap dipakai di layar lebar, dan tetap satu-satunya bentuk di
 * halaman admin. Di ponsel tabel itu meluber sekitar 89px dari lebar 375px
 * meski Mapel dan Tutor sudah disembunyikan, sehingga harus digeser mendatar —
 * gerakan yang jarang ditemukan sendiri, dan orang tua akan mengira kolomnya
 * memang hanya segitu.
 *
 * Penyaringnya sengaja BUKAN salinan milik `JadwalTable` (bulan/mapel/status).
 * Orang tua membuka daftar ini untuk satu-dua pertanyaan — "kapan les
 * berikutnya" dan "kemarin anak saya hadir tidak" — bukan untuk memeriksa
 * silang seperti admin, jadi yang ada di sini menjawab persis dua pertanyaan
 * itu: sisi waktu (akan datang / sudah lewat) dan mapel.
 *
 * Bulan tidak ikut disaring — ia sudah jadi akordeon di dalam daftar, dan
 * menutup bulan yang tidak dilihat mengerjakan hal yang sama tanpa menambah
 * kendali. Yang terbuka saat halaman dibuka adalah bulan berjalan, dan bulan
 * itu duduk paling atas; kalau ia tidak punya sesi, yang terbuka adalah bulan
 * terdekat sesudahnya.
 *
 * Bulan yang sudah lewat turun ke dasar halaman di bawah judul "Riwayat
 * Pembelajaran". Ia tidak dibuang — anak yang pindah kelas di tengah tahun
 * akan kehilangan seluruh jejaknya — tapi ia juga tidak boleh berdiri di
 * antara pembaca dan sesi berikutnya, yang hampir selalu jadi alasan halaman
 * ini dibuka.
 *
 * Akordeon itu juga yang menggantikan potongan "Lihat semua 24 sesi" yang dulu
 * ada di dasar daftar. Keduanya memangkas panjang halaman, tapi potongan itu
 * memangkas di tempat yang tidak berarti apa-apa — sesi ke-9 — sementara bulan
 * adalah satuan yang memang dipakai orang tua saat mencari.
 *
 * Status tidak disaring: sesi batal sudah bertanda merah dan jumlahnya sedikit;
 * menyaringnya berarti menyembunyikan justru yang paling perlu dilihat.
 *
 * Keduanya tidak lagi berdiri di atas daftar. Keduanya masuk ke satu lembar
 * yang dibuka dari ikon di bilah judul (`SaringSheet`), jadi tidak ada satu
 * baris pun yang terpakai kendali sebelum sesi pertama terlihat — padahal
 * saringannya dipakai sesekali, sementara sesi berikutnya dicari setiap kali.
 *
 * Saringan mapel tetap hanya muncul kalau memang ada yang bisa dipilih —
 * daftar berisi satu mapel bukan pilihan, cuma label yang menyamar jadi
 * kendali.
 *
 * Muka kartunya: hari dan tanggal, lalu "mapel · jam", lalu kehadiran atau
 * status di kanan atas. Nama tutor ditaruh di baris paling bawah: ia jarang
 * jadi alasan orang tua memindai daftar, tapi cukup sering ditanyakan untuk
 * tidak boleh hilang sama sekali — dan kini ia terlihat langsung, tanpa harus
 * membuka apa pun.
 *
 * Kosakata kehadirannya tetap dari `lib/kehadiran`, jadi label dan warnanya
 * sama persis dengan yang dibaca admin.
 *
 * Kartunya tidak bisa dibuka, dan sengaja begitu. Semua informasi yang
 * dipakai orang tua — tanggal, jam, mapel, tutor, kehadiran, alasan batal —
 * sudah tampil langsung di muka kartu; rincian kelas seperti tema, CP, materi,
 * asesmen, dan nilai tidak ditampilkan di sini. Bentuk ini selaras dengan
 * `SesiTable` versi layar lebar.
 */

type Sesi = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
  cancellation_reason?: string | null
}

type SisiWaktu = 'semua' | 'akan' | 'lewat'

const SISI: { nilai: SisiWaktu; label: string }[] = [
  { nilai: 'semua', label: 'Semua waktu' },
  { nilai: 'akan', label: 'Akan datang' },
  { nilai: 'lewat', label: 'Sudah lewat' },
]

function namaBulan(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

function kunciBulan(iso: string): string {
  // Geseran +7 jam yang sama dengan `bulanWib` di JadwalTable: sesi pagi
  // (00:00–06:59 WIB) jatuh di tanggal UTC sebelumnya, dan kalau itu tanggal 1
  // ia masuk ke bulan yang salah.
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

/** Tanggal menurut WIB, untuk membandingkan "sesi hari ini". */
function tanggalWib(iso: string): string {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export default function SesiKartuList({
  sessions,
  subjectNameMap,
  attendanceMap,
  sessionTutorMap,
  sekarangIso,
}: {
  sessions: Sesi[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
  /**
   * Jam server. Dibaca di sana dan diturunkan ke sini karena jam perangkat
   * pembaca bisa meleset berjam-jam — dan sesi yang sama akan masuk "akan
   * datang" di satu ponsel dan "sudah lewat" di ponsel lain.
   */
  sekarangIso: string
}) {
  const [sisi, setSisi] = useState<SisiWaktu>('semua')
  const [mapelDipilih, setMapelDipilih] = useState<string | null>(null)
  /**
   * Bulan yang dibuka-tutup dengan tangan. Hanya yang disentuh yang tercatat;
   * sisanya jatuh ke bawaan, jadi bulan yang baru muncul karena saringan
   * berubah tetap mengikuti aturan bawaan alih-alih membawa keadaan basi.
   */
  const [bulanDiubah, setBulanDiubah] = useState<Record<string, boolean>>({})

  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Belum ada sesi.</p>
  }

  const namaMapel = (s: Sesi) => (s.subject_id ? subjectNameMap[s.subject_id] : null)

  const mapelAda = [...new Set(sessions.map(namaMapel).filter((m): m is string => !!m))].sort(
    (a, b) => a.localeCompare(b),
  )

  const disaring = sessions.filter((s) => {
    if (sisi === 'akan' && s.scheduled_at < sekarangIso) return false
    if (sisi === 'lewat' && s.scheduled_at >= sekarangIso) return false
    if (mapelDipilih && namaMapel(s) !== mapelDipilih) return false
    return true
  })

  // Menaik: sesi paling awal di puncak, seperti jadwal yang dibaca dari atas ke
  // bawah — dan pemisah bulan di dalamnya jadi berurutan maju, bukan mundur.
  const urut = [...disaring].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

  // Dikelompokkan per bulan; urutan kelompoknya mengikuti urutan sesi yang sudah
  // menaik, jadi Map-nya cukup diisi sekali jalan.
  const perBulan = new Map<string, Sesi[]>()
  for (const s of urut) {
    const b = kunciBulan(s.scheduled_at)
    const isi = perBulan.get(b)
    if (isi) isi.push(s)
    else perBulan.set(b, [s])
  }
  const bulanIni = kunciBulan(sekarangIso)
  const kunciBulanAda = [...perBulan.keys()]

  // Bulan berjalan dan seterusnya duduk di puncak, menaik; bulan yang sudah
  // lewat turun ke dasar di bawah judulnya sendiri, menurun — yang paling baru
  // lewat lebih dekat ke bulan berjalan, jadi jarak dari puncak ke sebuah bulan
  // tetap sejalan dengan jarak waktunya.
  //
  // Sebelumnya semuanya satu deret menaik, yang berarti halaman dibuka pada
  // sesi paling lama: orang tua harus menggulir melewati seluruh semester untuk
  // sampai ke bulan yang sedang berjalan.
  const bulanMendatang = kunciBulanAda.filter((b) => b >= bulanIni)
  const bulanLampau = kunciBulanAda.filter((b) => b < bulanIni).reverse()

  // Yang dibuka: bulan berjalan. Kalau bulan itu tidak punya sesi — anak yang
  // baru mulai, atau saringan yang menyisihkannya — yang dibuka adalah bulan
  // terdekat SESUDAHNYA, karena pertanyaan yang membawa orang tua ke sini
  // hampir selalu "kapan les berikutnya"; kalau tidak ada juga, bulan terakhir
  // yang sudah lewat.
  const bulanBawaan = bulanMendatang[0] ?? bulanLampau[0] ?? ''

  // Garis biru di tepi kartu disisakan untuk SATU kartu: sesi berikutnya. Kalau
  // masih ada sisa jadwal hari ini, kartunya sesi hari ini itu; kalau tidak —
  // hari ini sudah beres, atau libur — kartunya sesi terdekat sesudahnya, dan
  // kartu yang sama itu menambah label "(berikutnya)" di sebelah tanggalnya.
  // Sesi yang dibatalkan tidak pernah jadi sorotan: ia tidak akan berjalan.
  const sesiAkanDatang = urut.filter(
    (s) => s.status !== 'cancelled' && s.scheduled_at >= sekarangIso,
  )
  const sesiHariIni = sesiAkanDatang.find((s) => tanggalWib(s.scheduled_at) === tanggalWib(sekarangIso))
  const sesiSorotId = sesiHariIni?.id ?? sesiAkanDatang[0]?.id ?? null
  const sesiSorotBerikutnya = !sesiHariIni && !!sesiAkanDatang[0]

  /** Satu kartu sesi. Dipisah supaya susunan akordeon di bawah tetap terbaca. */
  function kartuSesi(s: Sesi) {
    const dt = new Date(s.scheduled_at)
    const kehadiran = attendanceMap[s.id]
    const st = kehadiran
      ? (KEHADIRAN[kehadiran] ?? { label: kehadiran, cls: 'bg-gray-100 text-gray-500' })
      : null
    const sorot = sorotBaris(s.status, kehadiran)
    const mapel = s.subject_id ? subjectNameMap[s.subject_id] : null
    const tutor = sessionTutorMap[s.id]
    const disorot = s.id === sesiSorotId
    // Hanya kartu sorot yang memakai garis kiri biru setebal. Kartu lain
    // mempertahankan warna sisinya — merah untuk batal, dan warna kehadiran
    // untuk sesi yang sudah lewat. Sesi terjadwal yang tidak bertepatan tidak
    // memakai kelas tambahan, jadi ia jatuh ke garis kiri abu-abu 1px bawaan
    // dari `border border-slate-200` — tegas, tapi tidak setebal sorotan.
    const garis = disorot
      ? 'border-l-[3px] border-l-blue-500'
      : s.status === 'cancelled' || kehadiran
        ? `border-l-[3px] ${sorot.garis}`
        : 'border-l border-l-slate-200'

    return (
      <div
        key={s.id}
        className={`rounded-xl bg-white border border-slate-200 ${garis} overflow-hidden p-4`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {disorot && sesiSorotBerikutnya && (
              <div className="mb-1 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                <span className="text-xs font-medium text-blue-600">Berikutnya</span>
              </div>
            )}
            <p className={`text-sm font-semibold ${s.status === 'cancelled' ? 'text-red-500' : 'text-gray-900'}`}>
              {dt.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {mapel}
              {mapel && ' · '}
              {dt.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta',
              })}
              {' WIB'}
            </p>
          </div>
          {s.status === 'cancelled' ? (
            <span className="inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
              Dibatalkan
            </span>
          ) : st ? (
            <span className={`inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
              {st.label}
            </span>
          ) : (
            <span className="inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
              Terjadwal
            </span>
          )}
        </div>

        {s.status === 'cancelled' && s.cancellation_reason && (
          <p className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-red-500">
            {s.cancellation_reason}
          </p>
        )}

        {s.topic && (
          <p className="mt-2 text-base text-gray-900">
            {s.topic}
          </p>
        )}

        {tutor && (
          <p className="mt-2 text-xs text-gray-500">
            Tutor: {tutor}
          </p>
        )}
      </div>
    )
  }

  /** Satu bulan sebagai akordeon. */
  function blokBulan(kunci: string) {
    const sesiBulan = perBulan.get(kunci)
    if (!sesiBulan || sesiBulan.length === 0) return null
    const bukaBulan = bulanDiubah[kunci] ?? kunci === bulanBawaan
    return (
      <div key={kunci}>
        <button
          type="button"
          onClick={() => setBulanDiubah((b) => ({ ...b, [kunci]: !bukaBulan }))}
          aria-expanded={bukaBulan}
          className="flex w-full items-center gap-1.5 px-1 py-2 text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {namaBulan(sesiBulan[0].scheduled_at)}
          </span>
          {/* Jumlah sesinya ikut disebut: saat bulannya tertutup, ini
              satu-satunya isyarat ada berapa yang disembunyikan. */}
          <span className="text-xs text-gray-400">({sesiBulan.length})</span>
          <svg
            className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${
              bukaBulan ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {bukaBulan && <div className="space-y-2.5 pb-1">{sesiBulan.map(kartuSesi)}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Ikonnya berlabuh di bilah judul, bukan di sini — komponen ini cuma
          pemilik keadaannya. Lihat `SaringSheet`. */}
      <SaringSheet
        grup={[
          {
            judul: 'Waktu',
            opsi: SISI.map((x) => ({ nilai: x.nilai, label: x.label })),
            nilai: sisi,
            onPilih: (v) => setSisi(v as SisiWaktu),
            bawaan: 'semua',
          },
          ...(mapelAda.length > 1
            ? [
                {
                  judul: 'Mapel',
                  opsi: [
                    { nilai: '', label: 'Semua mapel' },
                    ...mapelAda.map((m) => ({ nilai: m, label: m })),
                  ],
                  nilai: mapelDipilih ?? '',
                  onPilih: (v: string) => setMapelDipilih(v || null),
                  bawaan: '',
                },
              ]
            : []),
        ]}
      />

      {perBulan.size === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Tidak ada sesi yang cocok dengan saringan ini.
        </p>
      )}

      {bulanMendatang.map(blokBulan)}

      {bulanLampau.length > 0 && (
        <>
          {/* Sengaja lebih tipis dan lebih pucat daripada label bulan di
              bawahnya. Keduanya sempat sama-sama `font-semibold text-gray-500`,
              dan judul yang setebal isinya terbaca seperti bulan lain dalam
              deret yang sama — bukan seperti penanda bahwa mulai dari sini
              semuanya sudah lewat. */}
          <p className="px-1 pt-4 text-xs font-normal uppercase tracking-widest text-gray-400">
            Riwayat Pembelajaran
          </p>
          {bulanLampau.map(blokBulan)}
        </>
      )}
    </div>
  )
}
