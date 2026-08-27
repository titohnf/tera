'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { HitunganMapel, MapelLatihan, TopikLatihan } from '@/lib/belajar/sesi'
import { adalahVideo, type MateriTopik } from '@/lib/belajar/sematan'
import { muatTopik, mulaiLatihan } from '@/app/belajar/actions'
import { ALL_GRADES } from '@/lib/curriculum-config'
import Avatar from '@/components/admin/availability/Avatar'
import IkonMapel from './IkonMapel'
import { useJudulKepala, useTombolKembali } from './Kepala'
import Materi from './Materi'

/**
 * Berapa soal per sesi. Tidak lagi bisa dipilih: tiga tombol angka di layar
 * anak adalah keputusan yang tidak ia punya dasarnya, dan satu ketukan lagi
 * sebelum tombol mulai. Sepuluh cukup untuk satu duduk, dan sesinya bisa
 * diulang.
 */
const JUMLAH_SOAL = 10

/**
 * Urutan sebuah jenjang di daftar, memakai `ALL_GRADES` sebagai acuan.
 *
 * Label yang tidak dikenal ditaruh di belakang, BUKAN dibuang: daftar yang
 * diam-diam kehilangan topik lebih buruk daripada daftar dengan satu kelompok
 * bernama aneh di ujung.
 */
function urutanKelas(label: string): number {
  const i = ALL_GRADES.indexOf(label)
  return i === -1 ? ALL_GRADES.length : i
}

/**
 * Memilih mapel, lalu satu topik, lalu membaca dan berlatih.
 *
 * Tiga langkah, bukan satu layar panjang: daftar topik satu mapel bisa puluhan
 * baris, dan menampilkan semuanya sekaligus membuat langkah pertama tenggelam.
 *
 * SATU topik sekali jalan, bukan sekumpulan centang. Yang dikerjakan anak dalam
 * sekali duduk memang satu topik, dan centang jamak menjanjikan susunan yang
 * tidak pernah ia butuhkan. Sekali ketuk pada nama topik langsung membuka
 * materinya; dari situ tinggal satu tombol.
 *
 * Sesi belum ada sampai tombol terakhir ditekan. Itu sebabnya seluruh keadaan
 * di sini boleh hidup di browser — tidak ada yang hilang kalau halamannya
 * ditutup di tengah, karena belum ada yang tercatat. Begitu sesi terbuka,
 * tempatnya bukan di sini lagi melainkan di `/belajar/[sesiId]`, yang bisa
 * dibuka ulang.
 */
export default function PemilihLatihan({
  mapel,
  anak,
  nama,
  avatar,
  labelKelas,
  awal,
}: {
  mapel: MapelLatihan[]
  /** Diteruskan apa adanya ke aksi; yang memeriksa haknya tetap database. */
  anak?: string
  /** Nama panggilan pelajarnya, untuk sapaan di layar pertama. */
  nama: string
  /** Foto profilnya; null berarti inisial. */
  avatar: string | null
  /** Kelas si anak sebagai teks ('Kelas 7'), atau null kalau belum diisi. */
  labelKelas: string | null
  /**
   * Topik yang harus langsung terbuka, dari `?topik=` — dipakai rincian sesi di
   * portal keluarga supaya "Materi" di sana menuju bahannya, bukan sekadar ke
   * daftar mapel yang menyuruh anak mencarinya sendiri.
   *
   * Mapelnya ikut karena daftar topik baru dimuat setelah mapel diketahui;
   * halaman yang menautkan sudah menelusurinya, jadi layar ini tidak perlu
   * menebak.
   */
  awal?: { subjectId: string; groupId: string } | null
}) {
  const [dipilih, setDipilih] = useState<MapelLatihan | null>(null)
  const [topik, setTopik] = useState<TopikLatihan[]>([])
  const [materi, setMateri] = useState<MateriTopik[]>([])
  /**
   * Jenjang kurikulum yang berlaku untuk pelajar ini, dari `muatTopik()`.
   * Elemen pertama adalah kelas aslinya; sisanya pengecualian per mapel.
   * Kosong berarti kelasnya belum diisi — lihat `konteks.ts`.
   */
  const [jenjang, setJenjang] = useState<string[]>([])
  const [kelasTerbuka, setKelasTerbuka] = useState<string[]>([])
  const [terpilih, setTerpilih] = useState<TopikLatihan | null>(null)
  /**
   * Mapelnya dibuka dari segmen "Tersedia di Kelasmu", jadi yang ditampilkan
   * hanya jenjang si anak. Membuka mapel yang sama dari katalog seluruh kelas
   * memberi daftar yang utuh — pintunya yang berbeda, bukan mapelnya.
   */
  const [lingkupKelas, setLingkupKelas] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  // Satu tombol kembali untuk tiga langkah, dan tempatnya di header. Yang
  // dimundurkan tergantung sejauh mana anaknya sudah masuk: dari topik terbuka
  // kembali ke daftar topik, dari daftar topik kembali ke daftar mapel, dan di
  // daftar mapel tidak ada yang bisa dimundurkan — header tidak menampilkan
  // tombolnya sama sekali.
  const kembali = useCallback(() => {
    setGalat(null)
    if (terpilih) setTerpilih(null)
    else if (dipilih) setDipilih(null)
  }, [terpilih, dipilih])
  useTombolKembali(terpilih || dipilih ? kembali : null)
  useJudulKepala(
    dipilih ? (lingkupKelas && labelKelas ? `${dipilih.subject_name} ${labelKelas}` : dipilih.subject_name) : null
  )

  /**
   * Satu kartu mapel. Angkanya DIOPER, bukan diambil dari `m`: mapel yang sama
   * muncul dua kali di layar ini — sekali dengan angka kelasnya, sekali dengan
   * angka seluruh jenjang — dan kartunya tidak perlu tahu ia sedang jadi yang
   * mana.
   *
   * `tegak` menyusunnya untuk grid dua kolom: ikonnya naik ke barisnya sendiri
   * dan semuanya rata tengah. Ukuran ikon, nama, dan angkanya SAMA PERSIS
   * dengan versi satu kolom — yang berubah cuma susunannya. Mengecilkan
   * salah satunya akan membuat mapel yang sama terlihat lebih kecil di segmen
   * kedua, seolah kelasnya sendiri yang membuatnya lebih penting.
   */
  function kartuMapel(m: MapelLatihan, angka: HitunganMapel, awalan: string, tegak = false) {
    // Nol dikerjakan diperlakukan SAMA dengan belum diketahui: tanpa cincin,
    // tanpa pembilang. Cincin kosong dan "0/31" hanya menyampaikan hal yang
    // sudah jelas dari angka soalnya sendiri, dan sebagai kabar pertama yang
    // dilihat anak di sebuah mapel, keduanya cuma menegaskan bahwa ia belum
    // berbuat apa-apa. Satu nilai untuk cincin dan angkanya, supaya keduanya
    // tidak pernah bercerita beda.
    const dikerjakan =
      angka.answered_count && angka.question_count > 0 ? angka.answered_count : null

    const ikon = (
      <IkonMapel
        nama={m.subject_name}
        persen={dikerjakan == null ? null : (dikerjakan / angka.question_count) * 100}
      />
    )
    const judul = (
      <span className="block font-semibold tracking-tight text-gray-900">{m.subject_name}</span>
    )
    {/* Kemajuannya menumpang di angka soal — "12/31 soal" mengatakan yang sama
        dengan kalimat sendiri, tanpa baris kedua yang mendorong hitungan materi
        ke seberang kartu. */}
    const hitungan = (
      <span className="mt-0.5 block text-xs text-gray-400">
        {dikerjakan == null
          ? `${angka.question_count} soal`
          : `${dikerjakan}/${angka.question_count} soal`}
        {` · ${angka.materi_count} materi`}
        {angka.video_count > 0 && ` · ${angka.video_count} video`}
      </span>
    )

    return (
      <button
        key={`${awalan}-${m.subject_id}`}
        type="button"
        disabled={sibuk}
        onClick={() => pilihMapel(m, awalan === 'kelas')}
        className={`flex w-full rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5 transition hover:ring-blue-300 active:bg-slate-50 disabled:opacity-60 ${
          tegak
            ? 'flex-col items-center gap-2 text-center'
            : 'items-center gap-3 text-left'
        }`}
      >
        {ikon}
        <span className="min-w-0 w-full">
          {judul}
          {hitungan}
        </span>
      </button>
    )
  }

  function pilihMapel(m: MapelLatihan, hanyaKelas = false, bukaGroupId?: string) {
    setGalat(null)
    mulai(async () => {
      const daftar = await muatTopik(anak, m.subject_id)
      setTopik(daftar.topik)
      setMateri(daftar.materi)
      setJenjang(daftar.jenjang)
      // Yang terbuka begitu mapelnya dibuka — dan itu tergantung pintunya.
      // Lewat segmen kelas, daftarnya memang sudah sebatas kelas itu dan
      // semuanya dibuka. Lewat katalog seluruh kelas, TIDAK ADA yang dibuka
      // lebih dulu: di sana kelas si anak bukan kelas istimewa, dan membukanya
      // sendiri berarti katalog yang seharusnya netral tetap berpihak.
      setKelasTerbuka(
        bukaGroupId
          ? [...new Set(daftar.topik.map(t => t.grade_level))]
          : hanyaKelas
            ? [...new Set(daftar.topik.map(t => t.grade_level))]
            : []
      )
      // Topik yang diminta `?topik=` dibuka langsung. Kalau ia tidak ada di
      // daftar — sudah dihapus dari kurikulum, atau tidak berhak dibaca — yang
      // terjadi cuma layar berhenti di daftar topik. Itu keadaan yang wajar
      // untuk tautan lama, dan tidak pantas jadi pesan galat.
      setTerpilih(bukaGroupId ? (daftar.topik.find(t => t.group_id === bukaGroupId) ?? null) : null)
      setLingkupKelas(hanyaKelas)
      setDipilih(m)
    })
  }

  // Sekali jalan, saat halaman dibuka dengan `?topik=`. `useRef` menjaganya
  // tidak berulang: `pilihMapel` memanggil `startTransition`, dan tanpa penjaga
  // ini setiap render berikutnya akan memuat ulang daftar topik yang sama.
  const sudahBuka = useRef(false)
  useEffect(() => {
    if (!awal || sudahBuka.current) return
    const m = mapel.find(x => x.subject_id === awal.subjectId)
    if (!m) return
    sudahBuka.current = true
    pilihMapel(m, m.di_kelas && !!m.kelas, awal.groupId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awal, mapel])

  function mulaiSesi() {
    if (!dipilih || !terpilih) return
    setGalat(null)
    mulai(async () => {
      const hasil = await mulaiLatihan(anak, dipilih.subject_id, [terpilih.group_id], JUMLAH_SOAL)
      // Hanya tercapai kalau aksinya TIDAK mengalihkan halaman.
      if (hasil?.error) setGalat(hasil.error)
    })
  }

  if (mapel.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500 leading-relaxed">
          Belum ada mapel yang siap dibuka — baik soal maupun materinya belum ada.
        </p>
      </div>
    )
  }

  if (!dipilih) {
    // Dua segmen yang TUMPANG TINDIH dengan sengaja. Yang pertama menjawab
    // "apa yang untukku", dengan angka kelasnya sendiri; yang kedua adalah
    // katalog utuh — mapel yang sama boleh muncul lagi di sana dengan angka
    // seluruh jenjang, karena anak yang mau mengulang kelas bawah atau menengok
    // kelas atas mencarinya di daftar yang lengkap, bukan di sisa-sisa daftar
    // pertama.
    const diKelas = mapel.filter(m => m.di_kelas && m.kelas)

    return (
      <div className="space-y-2">
        {/* Sapaan, bukan cuma pertanyaan: layar ini dibuka atas nama seorang
            anak tertentu, dan sejak kartu "Berlatih sebagai" dihapus namanya
            tidak muncul di mana pun lagi. Di sini ia mengerjakan dua hal
            sekaligus — menyapa, dan memberi tahu sedang jadi siapa. */}
        <div className="flex items-center gap-3 pb-1">
          <Avatar name={nama} avatarUrl={avatar} size={44} />
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-gray-900">Halo, {nama}</p>
            <p className="mt-0.5 text-sm text-gray-500">Mau berlatih apa?</p>
          </div>
        </div>

        {diKelas.length > 0 && (
          <div className="space-y-2">
            {/* Judulnya menyebut apa isi segmen ini, bukan cuma nomor kelasnya.
                "Kelas 7" sendirian menuntut anak menyimpulkan kenapa kelas itu
                yang di atas; kalimatnya mengatakannya langsung, dan nomornya
                jadi keterangan di ujung barisnya. */}
            <div className="flex items-baseline justify-between gap-3 pt-4 pb-1">
              <p className="font-semibold tracking-tight text-gray-900">Tersedia di Kelasmu</p>
              <p className="shrink-0 text-xs text-gray-500">{labelKelas}</p>
            </div>
            {diKelas.map(m => kartuMapel(m, m.kelas!, 'kelas'))}
          </div>
        )}

        <div>
          {/* Judul segmen hanya muncul kalau ada segmen pertama yang dipisahkan
              darinya. Tanpa itu, daftar ini satu-satunya yang ada dan tidak
              sedang dibedakan dari apa pun. */}
          {diKelas.length > 0 && (
            <p className="pt-4 pb-2 font-semibold tracking-tight text-gray-900">
              Dari Seluruh Kelas
            </p>
          )}
          {/* Dua kolom: katalog utuh yang berbaris satu-satu jadi gulungan
              panjang, sementara yang dicari di sini biasanya nama mapel — dan
              nama lebih cepat dipindai kalau lebih banyak yang muat sekaligus.
              Segmen kelasnya tetap satu kolom: itu daftar pendek yang memang
              ingin dibaca satu per satu. */}
          <div className="grid grid-cols-2 gap-2">
            {mapel.map(m => kartuMapel(m, m, 'semua', true))}
          </div>
        </div>
      </div>
    )
  }

  // TIDAK disaring. Dulu baris ini membuang topik yang nol soal — dan karena
  // tidak ada satu pun topik yang punya soal sekaligus materi, seluruh 53
  // materi yang sudah dikumpulkan tidak bisa dicapai siapa pun. Yang belum
  // lengkap sekarang disebutkan, bukan disembunyikan: setiap topik seharusnya
  // punya keduanya, dan daftar yang diam soal yang belum ada cuma memindahkan
  // kejutannya ke orang tua.
  const tersedia = topik
  const materiPerTopik = new Map<string, { materi: number; video: number }>()
  for (const m of materi) {
    const hitung = materiPerTopik.get(m.group_id) ?? { materi: 0, video: 0 }
    if (adalahVideo(m.link_url)) hitung.video++
    else hitung.materi++
    materiPerTopik.set(m.group_id, hitung)
  }

  /** Berapa soal dan berapa materi. Temanya TIDAK di sini — tempatnya di atas
      nama topik, sebagai label, bukan disambung ke deretan angka. */
  function keterangan(t: TopikLatihan) {
    const hitung = materiPerTopik.get(t.group_id)
    const bacaan = hitung?.materi ?? 0
    const video = hitung?.video ?? 0
    return (
      <>
        {/* Angka, bukan "belum ada". Nol sudah mengatakan hal yang sama dengan
            lebih sedikit kata, dan sebaris angka lebih mudah dibandingkan
            sekilas daripada campuran angka dan kalimat. Warnanya yang tetap
            menandai mana yang masih kosong. */}
        <span className={t.question_count > 0 ? '' : 'text-amber-600'}>
          {t.question_count} soal
        </span>
        {' · '}
        <span className={bacaan > 0 ? '' : 'text-amber-600'}>{bacaan} materi</span>
        {video > 0 && ` · ${video} video`}
      </>
    )
  }

  // Langkah ketiga: satu topik terbuka, bahannya di layar, satu tombol. Materi
  // muncul SETELAH topiknya diketuk, bukan tergeletak di bawah daftar —
  // menumpahkan seluruh bahan mapel ke layar bukan menolong siapa pun.
  if (terpilih) {
    const materiTopik = materi.filter(m => m.group_id === terpilih.group_id)
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
          <p className="text-xs text-gray-400">
            {dipilih.subject_name} · {terpilih.grade_level}
            {terpilih.theme ? ` · ${terpilih.theme}` : ''}
          </p>
          <p className="mt-0.5 font-semibold tracking-tight text-gray-900">{terpilih.topic}</p>
          <p className="mt-0.5 text-xs text-gray-400">{keterangan(terpilih)}</p>
        </div>

        <Materi materi={materiTopik} />

        {galat && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
            {galat}
          </p>
        )}

        {/* Topik tanpa soal tidak menyodorkan tombol yang sudah pasti gagal.
            Materinya tetap terbaca di atas — itu memang setengah dari yang
            dijanjikan permukaan ini. */}
        {terpilih.question_count > 0 ? (
          <button
            type="button"
            disabled={sibuk}
            onClick={mulaiSesi}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
          >
            {/* Angka yang sebenarnya, bukan sepuluh mentah: topik yang cuma
                punya satu soal tidak menjanjikan sepuluh. Undiannya di database
                memang mengambil seadanya — tapi janji di tombol harus sama
                dengan yang datang di layar berikutnya. */}
            {sibuk
              ? 'Menyiapkan…'
              : `Mulai Latihan (${Math.min(JUMLAH_SOAL, terpilih.question_count)} soal)`}
          </button>
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-500 shadow ring-1 ring-gray-900/5">
            Topik ini belum punya soal, jadi latihannya belum bisa dimulai.
          </p>
        )}
      </div>
    )
  }

  // Dikelompokkan per jenjang. `practice_topics()` mengembalikan SELURUH topik
  // sebuah mapel, Kelas 1 sampai Kelas 12, dan sebagai daftar datar anak yang
  // membukanya tidak punya cara tahu mana barisnya. Kelompok kelasnya sendiri
  // ada di atas dan terbuka; sisanya tetap ada, terlipat — anak yang perlu
  // mengulang jenjang bawah tidak kehilangan apa pun.
  // Dibuka dari segmen kelasnya berarti daftarnya juga sebatas kelas itu.
  // Judul headernya sudah menyebutkan lingkupnya ("Matematika Kelas 7"), dan
  // menyodorkan Kelas 1 sampai 12 di bawah judul itu membatalkan janjinya.
  // Katalog seluruh kelas tetap ada, satu ketukan jauhnya, lewat pintu yang
  // lain.
  const perKelas = new Map<string, TopikLatihan[]>()
  for (const t of lingkupKelas ? tersedia.filter(t => jenjang.includes(t.grade_level)) : tersedia) {
    const daftar = perKelas.get(t.grade_level)
    if (daftar) daftar.push(t)
    else perKelas.set(t.grade_level, [t])
  }
  // Kelas si anak hanya diistimewakan kalau mapelnya dibuka lewat pintunya.
  // Dari katalog seluruh kelas, jenjangnya sengaja diabaikan: yang membuka dari
  // sana sedang mencari kelas lain, dan Kelas 7 yang tetap melompat ke atas
  // dengan lencananya sendiri membuat katalog itu menjawab pertanyaan yang
  // tidak diajukan.
  const jenjangIstimewa = lingkupKelas ? jenjang : []
  // Kelompok milik si anak naik ke atas dengan urutan aslinya: kelas
  // sesungguhnya dulu, baru kurikulum pengecualiannya.
  const pangkat = (label: string) => {
    const i = jenjangIstimewa.indexOf(label)
    return i === -1 ? jenjangIstimewa.length + urutanKelas(label) : i
  }
  const kelompok = [...perKelas.entries()].sort(([a], [b]) => pangkat(a) - pangkat(b))
  // Dua segmen, bukan satu tumpukan berurutan: kelas si anak berdiri sendiri di
  // atas, sisanya di bawah judulnya sendiri. Urutan saja sudah pernah cukup
  // waktu semuanya tinggal di dalam satu kartu — begitu kartunya dilepas,
  // yang membedakan "punyaku" dari "punya orang lain" tinggal jaraknya.
  const milik = kelompok.filter(([label]) => jenjangIstimewa.includes(label))
  const lainnya = kelompok.filter(([label]) => !jenjangIstimewa.includes(label))

  function barisTopik(t: TopikLatihan) {
    return (
      <button
        key={t.group_id}
        type="button"
        disabled={sibuk}
        onClick={() => {
          setGalat(null)
          setTerpilih(t)
        }}
        className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow ring-1 ring-gray-900/5 transition hover:ring-blue-300 active:bg-slate-50 disabled:opacity-60"
      >
        <span className="min-w-0 flex-1">
          {/* Tema di ATAS namanya, sebagai label: ia yang memberi tahu topik ini
              bagian dari apa, dan sebagai ekor di baris angka ia terbaca seolah
              salah satu hitungan. */}
          {t.theme && <span className="block text-xs text-gray-400">{t.theme}</span>}
          <span className="block font-semibold tracking-tight text-gray-900">{t.topic}</span>
          {/* Semester sengaja tidak ditampilkan: untuk kurikulum seperti TKA
              yang tidak mengenal semester, angkanya cuma kebisingan. Jenjangnya
              tidak lagi disembunyikan — sejak daftar ini dikelompokkan, justru
              itu yang membuat anak tahu baris mana miliknya. */}
          <span className="mt-0.5 block truncate text-xs text-gray-400">{keterangan(t)}</span>
        </span>
        <span className="shrink-0 text-lg text-gray-300" aria-hidden>
          ›
        </span>
      </button>
    )
  }

  /** Kelas si anak: terbuka, tanpa tombol lipat. Yang memang miliknya tidak
      perlu dibuka dulu setiap kali. */
  function kelasMilik([label, daftar]: [string, TopikLatihan[]]) {
    // Satu kelompok dalam lingkup kelas tidak perlu judul: headernya sudah
    // menyebut kelas yang sama, dan mengulanginya di baris pertama isi cuma
    // sekat kosong. Pengecualian jenjang (migrasi 105) membuat kelompoknya bisa
    // lebih dari satu — di situ judulnya kembali berguna.
    if (lingkupKelas && kelompok.length === 1) {
      return (
        <div key={label} className="flex flex-col gap-2">
          {daftar.map(barisTopik)}
        </div>
      )
    }
    return (
      <div key={label}>
        <div className="flex items-center gap-2 pb-1">
          <span className="font-semibold tracking-tight text-gray-900">{label}</span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {label === jenjangIstimewa[0] ? 'kelas kamu' : 'kurikulum kamu'}
          </span>
        </div>
        <div className="flex flex-col gap-2">{daftar.map(barisTopik)}</div>
      </div>
    )
  }

  /** Kelas lain: terlipat, dan jumlah topiknya disebut supaya yang membukanya
      tahu apa yang menunggu. */
  function kelasLain([label, daftar]: [string, TopikLatihan[]]) {
    return (
      <details
        key={label}
        open={kelasTerbuka.includes(label)}
        onToggle={e => {
          // Dibaca di luar updater: `currentTarget` sudah kosong saat React
          // menjalankan fungsi pembarunya.
          const terbuka = e.currentTarget.open
          setKelasTerbuka(sebelumnya =>
            terbuka === sebelumnya.includes(label)
              ? sebelumnya
              : terbuka
                ? [...sebelumnya, label]
                : sebelumnya.filter(l => l !== label)
          )
        }}
        className="group"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 border-b border-gray-200 py-3 text-sm group-open:border-transparent">
          <span className="text-gray-400 transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
          <span className="text-gray-700">{label}</span>
          <span className="text-xs text-gray-400">{daftar.length} topik</span>
        </summary>
        <div className="flex flex-col gap-2 pb-4">{daftar.map(barisTopik)}</div>
      </details>
    )
  }

  return (
    <div className="space-y-4">
      {tersedia.length === 0 && (
        <p className="text-sm text-gray-500">Belum ada topik di mapel ini.</p>
      )}

      {milik.length > 0 && <div className="space-y-4">{milik.map(kelasMilik)}</div>}

      {lainnya.length > 0 && (
        <div>
          {/* Judul segmen hanya muncul kalau ada segmen pertama yang dipisahkan
              darinya. Kelas si anak tidak diketahui — atau mapel ini tidak punya
              apa pun di kelasnya — berarti tidak ada "lain"-nya. */}
          {milik.length > 0 && (
            <p className="border-t border-gray-200 pt-4 text-sm text-gray-500">Kelas lain</p>
          )}
          {lainnya.map(kelasLain)}
        </div>
      )}
    </div>
  )
}
