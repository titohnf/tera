'use client'

import { useState, useTransition } from 'react'
import { KEHADIRAN, sorotBaris } from '@/lib/kehadiran'
import { getJadwalSessionDetail, type JadwalSessionDetail } from '@/lib/actions/jadwal'
import RincianSesi from '@/components/siswa/RincianSesi'
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
 * Muka kartunya: hari dan tanggal, lalu "mapel · jam", lalu topik sebagai
 * segmen sendiri di bawah garis tipis. Nama kelas
 * dilepas — di portal keluarga ia hampir selalu mengulang mapel yang sudah
 * disebut tepat di bawahnya ("Matematika 8A" di bawah "Matematika"), dan tag
 * uniknya justru bocor ke pembaca yang tidak punya halaman kelas untuk dituju.
 * Nama tutor turun ke tabel rincian, di baris paling bawah: ia jarang jadi
 * alasan orang tua memindai daftar, tapi cukup sering ditanyakan untuk tidak
 * boleh hilang sama sekali.
 *
 * Kosakata kehadirannya tetap dari `lib/kehadiran`, jadi label dan warnanya
 * sama persis dengan yang dibaca admin.
 *
 * Kartunya bisa dibuka, dan isinya `RincianSesi` — komponen yang sama dengan
 * yang dipakai baris `JadwalTable` di layar lebar. Sebelum ada ini, tema,
 * daftar CP, tautan materi, latihan soal, nilai asesmen, dan catatan tutor
 * sama sekali tidak terjangkau dari ponsel: satu-satunya jalan ke sana adalah
 * membuka baris tabel yang justru `hidden lg:block`.
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

export default function SesiKartuList({
  sessions,
  subjectNameMap,
  attendanceMap,
  sessionTutorMap,
  studentId,
  sekarangIso,
}: {
  sessions: Sesi[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
  studentId: string
  /**
   * Jam server. Dibaca di sana dan diturunkan ke sini karena jam perangkat
   * pembaca bisa meleset berjam-jam — dan sesi yang sama akan masuk "akan
   * datang" di satu ponsel dan "sudah lewat" di ponsel lain.
   */
  sekarangIso: string
}) {
  const [sisi, setSisi] = useState<SisiWaktu>('semua')
  const [mapelDipilih, setMapelDipilih] = useState<string | null>(null)
  const [dibuka, setDibuka] = useState<string | null>(null)
  /**
   * Bulan yang dibuka-tutup dengan tangan. Hanya yang disentuh yang tercatat;
   * sisanya jatuh ke bawaan, jadi bulan yang baru muncul karena saringan
   * berubah tetap mengikuti aturan bawaan alih-alih membawa keadaan basi.
   */
  const [bulanDiubah, setBulanDiubah] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<Record<string, JadwalSessionDetail | null>>({})
  const [memuat, startMemuat] = useTransition()

  function bukaTutup(id: string) {
    if (dibuka === id) {
      setDibuka(null)
      return
    }
    setDibuka(id)
    // Sekali ambil per sesi; hasilnya disimpan supaya membuka ulang tidak
    // memanggil server lagi.
    if (detail[id] !== undefined) return
    startMemuat(async () => {
      const hasil = await getJadwalSessionDetail(id, studentId)
      setDetail((d) => ({ ...d, [id]: hasil }))
    })
  }

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

    const terbuka = dibuka === s.id

    return (
      <div
        key={s.id}
        className={`rounded-xl bg-white border border-slate-200 border-l-[3px] ${sorot.garis} overflow-hidden`}
      >
        <button
          type="button"
          onClick={() => bukaTutup(s.id)}
          aria-expanded={terbuka}
          className="w-full text-left p-4 active:bg-slate-50 transition-colors"
        >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${s.status === 'cancelled' ? 'text-red-500' : 'text-gray-900'}`}>
              {dt.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            {/* Jam menempel di belakang mapel, bukan berdiri sendiri: sebaris
                "Matematika · 19:00" terbaca sekali lihat, sementara jam yang
                punya barisnya sendiri menambah tinggi kartu tanpa menambah
                apa pun yang belum terbaca. */}
            {/* 12px, sedikit lebih kecil daripada tanggal di atasnya dan topik
                di bawahnya: baris ini penunjuk, bukan isi. Berat normal, bukan
                `font-light` — pada 12px dan warna abu, huruf tipis mulai luntur
                di layar ponsel yang terang. */}
            <p className="text-xs text-gray-500 mt-0.5">
              {mapel}
              {mapel && ' · '}
              {/* `timeZone` dipasang begitu jamnya dilabeli WIB. Tanpa itu
                  angkanya mengikuti zona waktu perangkat pembaca, dan label
                  WIB di sebelahnya jadi janji yang tidak ditepati untuk
                  keluarga yang sedang di luar zona itu. */}
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

        {s.topic && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
            <p className="text-sm text-gray-700">{s.topic}</p>
          </div>
        )}

        {s.status === 'cancelled' && s.cancellation_reason && (
          <p className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-red-500">
            {s.cancellation_reason}
          </p>
        )}

        <span className="flex items-center justify-center gap-1 mt-2.5 pt-2.5 border-t border-slate-100 text-xs font-medium text-blue-600">
          {terbuka ? 'Tutup rincian' : 'Lihat rincian'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${terbuka ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        </button>

        {terbuka && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
            <RincianSesi
              detail={memuat && detail[s.id] === undefined ? undefined : detail[s.id]}
              sessionId={s.id}
              topikSesi={s.topic}
              tutor={tutor}
            />
          </div>
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
