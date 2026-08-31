'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { HitunganMapel, MapelLatihan, TopikLatihan } from '@/lib/belajar/sesi'
import type { MateriTopik } from '@/lib/belajar/sematan'
import { adalahVideo } from '@/lib/belajar/sematan'
import BilahJawaban, { KeteranganJawaban } from './BilahJawaban'
import { persenDari } from '@/lib/belajar/penilaian'
import { muatTopik } from '@/app/belajar/actions'
import { ALL_GRADES } from '@/lib/curriculum-config'
import Avatar from '@/components/admin/availability/Avatar'
import IkonMapel from './IkonMapel'
import { useJudulKepala, useTombolKembali } from './Kepala'
import Materi from './Materi'
import DaftarPaket from './DaftarPaket'

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

/** Pembanding pencarian: tanpa beda huruf besar-kecil, tanpa spasi di ujung. */
function normal(teks: string): string {
  return teks.toLowerCase().trim()
}

/**
 * Langkah yang sedang dibuka, sebagaimana ia tercatat di riwayat peramban.
 *
 * `kelas` ikut karena mapel yang sama bisa dibuka lewat dua pintu — segmen
 * kelasnya, atau katalog seluruh kelas — dan yang membedakan isi layarnya
 * cuma itu. Tanpa disimpan, mundur dari sebuah topik bisa mendarat di daftar
 * yang lebih panjang daripada yang tadi ditinggalkan.
 */
type Langkah = { mapel: string | null; topik: string | null; kelas: boolean }

/** Isi satu mapel yang sudah dimuat, disimpan supaya tidak diminta dua kali. */
type Daftar = {
  topik: TopikLatihan[]
  materi: MateriTopik[]
  jenjang: string[]
}

/** Panah kanan, dipakai baris topik dan pembuka kelompok kelas. */
function Panah({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

/** Penanda "sedang diambil", untuk kartu mapel yang barusan diketuk. */
function Pemutar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={3} className="opacity-20" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  )
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
 *
 * Ketiga langkahnya PUNYA ALAMAT, meski tidak satu pun berpindah halaman.
 * Setiap ketukan mendorong satu entri riwayat lewat `history.pushState`, dan
 * tombol kembali perangkat memundurkan langkah persis seperti tombol di header.
 * Sebelumnya keduanya berbeda: yang di header mundur selangkah, yang di
 * perangkat melompat keluar dari seluruh permukaan — dan di ponsel tombol
 * itulah yang paling sering dipakai. Yang didorong cuma alamat; datanya tetap
 * di sini, jadi mundur-maju tidak memanggil server sama sekali.
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
   * daftar mapel yang menyuruh anak mencarinya sendiri. Halaman hasil memakai
   * pintu yang sama untuk "Ulangi Topik Ini".
   *
   * Mapelnya ikut karena daftar topik baru dimuat setelah mapel diketahui;
   * halaman yang menautkan sudah menelusurinya, jadi layar ini tidak perlu
   * menebak.
   *
   * Tanpa `groupId` berarti yang diminta cuma mapelnya (`?mapel=`) — alamat
   * langkah kedua yang dibuka ulang. `kelas` menyebut lewat pintu mana ia
   * dibuka; tidak disebut berarti diputuskan di sini, dari kelas si anak.
   */
  awal?: { subjectId: string; groupId?: string; kelas?: boolean } | null
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
  /** Mapel yang isinya sedang diambil, untuk penanda di kartunya. */
  const [memuat, setMemuat] = useState<string | null>(null)
  const [cariMapel, setCariMapel] = useState('')
  const [cariTopik, setCariTopik] = useState('')
  /** Saringan daftar topik. Lihat `SARINGAN` di bawah. */
  const [saringan, setSaringan] = useState<Saringan>('semua')
  const [, mulai] = useTransition()

  /**
   * Isi mapel yang sudah pernah diambil, seumur halaman ini terbuka.
   *
   * Mundur ke daftar mapel lalu masuk lagi ke mapel yang sama dulu berarti
   * satu perjalanan penuh ke server untuk daftar yang tidak berubah — dan
   * itulah gerak yang paling sering dilakukan orang yang sedang mencari-cari.
   * Kemajuannya boleh ikut tersimpan: yang mengubahnya cuma sesi yang selesai,
   * dan sesi selesai selalu kembali ke sini lewat pemuatan halaman baru.
   */
  const simpanan = useRef(new Map<string, Daftar>())

  // ── Riwayat peramban ──────────────────────────────────────────────────────
  // Berapa entri yang SUDAH kita dorong sendiri. Disimpan di dalam entrinya,
  // bukan cuma di ref: `popstate` bisa mundur maupun maju, dan hitungan yang
  // dinaik-turunkan sendiri akan meleset begitu orang menekan "maju".
  const kedalaman = useRef(0)

  const alamat = useCallback(
    (l: Langkah) => {
      const q = new URLSearchParams()
      if (anak) q.set('anak', anak)
      if (l.mapel) q.set('mapel', l.mapel)
      if (l.topik) q.set('topik', l.topik)
      if (l.kelas) q.set('lingkup', 'kelas')
      const s = q.toString()
      return `${window.location.pathname}${s ? `?${s}` : ''}`
    },
    [anak]
  )

  const dorong = useCallback(
    (l: Langkah) => {
      kedalaman.current += 1
      window.history.pushState({ belajar: l, dalam: kedalaman.current }, '', alamat(l))
    },
    [alamat]
  )

  /** Mengganti entri yang sedang berlaku — dipakai saat layar dibuka, dan saat
      mundur tanpa entri milik sendiri untuk dimundurkan. */
  const ganti = useCallback(
    (l: Langkah) => {
      window.history.replaceState({ belajar: l, dalam: kedalaman.current }, '', alamat(l))
    },
    [alamat]
  )

  /** Memasang isi sebuah mapel ke layar, tanpa menyentuh riwayat. */
  const terapkan = useCallback((m: MapelLatihan, d: Daftar, l: Langkah) => {
    setTopik(d.topik)
    setMateri(d.materi)
    setJenjang(d.jenjang)
    const dibuka = l.topik ? d.topik.find(t => t.group_id === l.topik) : null
    // Lingkup kelas DIBATALKAN kalau topik yang diminta bukan dari jenjang si
    // anak. Tautan `?topik=` dari luar tidak menyebutkan lewat pintu mana ia
    // dibuka, dan tebakan bawaannya "lewat kelasnya sendiri" — jadi topik Kelas
    // 9 yang dibuka dari halaman Penguasaan mendarat di bawah judul "Matematika
    // Kelas 7", dan mundur selangkah memberi daftar yang tidak memuat topik
    // yang barusan dilihat.
    const kelas = l.kelas && (!dibuka || d.jenjang.includes(dibuka.grade_level))
    // Yang terbuka begitu mapelnya dibuka — dan itu tergantung pintunya.
    // Lewat segmen kelas, daftarnya memang sudah sebatas kelas itu dan
    // semuanya dibuka. Lewat katalog seluruh kelas, TIDAK ADA yang dibuka
    // lebih dulu: di sana kelas si anak bukan kelas istimewa, dan membukanya
    // sendiri berarti katalog yang seharusnya netral tetap berpihak. Kecuali
    // untuk topik yang memang diminta — kelompoknya harus terbuka, kalau tidak
    // mundur dari topik itu mendarat di daftar yang tidak memuatnya.
    setKelasTerbuka(
      kelas
        ? [...new Set(d.topik.map(t => t.grade_level))]
        : dibuka
          ? [dibuka.grade_level]
          : []
    )
    // Topik yang diminta tidak ada di daftar — sudah dihapus dari kurikulum,
    // atau tidak berhak dibaca — cuma membuat layar berhenti di daftar topik.
    // Itu keadaan yang wajar untuk tautan lama, dan tidak pantas jadi galat.
    setTerpilih(dibuka ?? null)
    setLingkupKelas(kelas)
    setDipilih(m)
    setCariTopik('')
    setSaringan('semua')
    // Alamatnya ikut dikoreksi kalau lingkupnya ternyata bukan yang tertulis.
    // Sebuah entri riwayat yang menyebut `lingkup=kelas` untuk layar yang tidak
    // sedang dalam lingkup kelas akan membuka layar yang berbeda begitu
    // dimuat ulang — dan alamat yang tidak bisa dipercaya lebih buruk daripada
    // tidak punya alamat sama sekali.
    if (kelas !== l.kelas) ganti({ ...l, kelas })
  }, [ganti])

  /**
   * Membuka sebuah mapel. Dari simpanan kalau ada — seketika, tanpa penanda
   * memuat yang berkelip untuk sesuatu yang sudah ada di tangan.
   */
  const buka = useCallback(
    (m: MapelLatihan, l: Langkah) => {
      setGalat(null)
      const ada = simpanan.current.get(m.subject_id)
      if (ada) {
        terapkan(m, ada, l)
        return
      }
      setMemuat(m.subject_id)
      mulai(async () => {
        try {
          const d = await muatTopik(anak, m.subject_id)
          simpanan.current.set(m.subject_id, d)
          terapkan(m, d, l)
        } finally {
          setMemuat(null)
        }
      })
    },
    [anak, terapkan]
  )

  function pilihMapel(m: MapelLatihan, hanyaKelas = false) {
    const l: Langkah = { mapel: m.subject_id, topik: null, kelas: hanyaKelas }
    dorong(l)
    buka(m, l)
  }

  function pilihTopik(t: TopikLatihan) {
    setGalat(null)
    dorong({ mapel: dipilih?.subject_id ?? null, topik: t.group_id, kelas: lingkupKelas })
    setTerpilih(t)
  }

  // Satu tombol kembali untuk tiga langkah, dan tempatnya di header. Yang
  // dimundurkan tergantung sejauh mana anaknya sudah masuk: dari topik terbuka
  // kembali ke daftar topik, dari daftar topik kembali ke daftar mapel, dan di
  // daftar mapel tidak ada yang bisa dimundurkan — header tidak menampilkan
  // tombolnya sama sekali.
  //
  // Yang dipanggil riwayat peramban, supaya tombol ini dan tombol kembali
  // perangkat menempuh jalan yang sama persis. Kecuali kalau tidak ada entri
  // milik kita untuk dimundurkan — halaman yang langsung dibuka di sebuah topik
  // lewat `?topik=` — di situ `history.back()` akan melempar orang keluar dari
  // permukaan ini, dan langkahnya dimundurkan di tempat.
  const kembali = useCallback(() => {
    setGalat(null)
    if (kedalaman.current > 0) {
      window.history.back()
      return
    }
    if (terpilih) {
      setTerpilih(null)
      ganti({ mapel: dipilih?.subject_id ?? null, topik: null, kelas: lingkupKelas })
    } else if (dipilih) {
      setDipilih(null)
      setTerpilih(null)
      ganti({ mapel: null, topik: null, kelas: false })
    }
  }, [terpilih, dipilih, lingkupKelas, ganti])
  useTombolKembali(terpilih || dipilih ? kembali : null)
  useJudulKepala(
    dipilih ? (lingkupKelas && labelKelas ? `${dipilih.subject_name} ${labelKelas}` : dipilih.subject_name) : null
  )

  // Sekali jalan, saat halaman dibuka. `?topik=` yang sudah ditelusuri server
  // (`awal`) membuka topiknya langsung; tanpa itu, yang dikerjakan cuma
  // mencatat langkah pertama ke entri riwayat yang sedang berlaku, supaya
  // mundur dari langkah kedua punya tujuan yang jelas.
  const sudahBuka = useRef(false)
  useEffect(() => {
    if (sudahBuka.current) return
    sudahBuka.current = true
    if (!awal) {
      ganti({ mapel: null, topik: null, kelas: false })
      return
    }
    const m = mapel.find(x => x.subject_id === awal.subjectId)
    if (!m) {
      ganti({ mapel: null, topik: null, kelas: false })
      return
    }
    const l: Langkah = {
      mapel: m.subject_id,
      topik: awal.groupId ?? null,
      kelas: awal.kelas ?? (m.di_kelas && !!m.kelas),
    }
    ganti(l)
    // Memang menyetel keadaan dari dalam efek, dan memang harus: yang dibuka
    // ditentukan alamat halaman, dan isinya cuma bisa diminta setelah komponen
    // ini terpasang. Jalannya sekali seumur halaman, dijaga `sudahBuka`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buka(m, l)
  }, [awal, mapel, buka, ganti])

  // Mundur dan maju di peramban. Yang dipulihkan langkahnya, bukan datanya:
  // isi mapel diambil dari simpanan, dan cuma benar-benar diminta ulang kalau
  // entri yang dituju milik mapel yang belum pernah dibuka di halaman ini.
  useEffect(() => {
    function pulihkan(e: PopStateEvent) {
      const l = (e.state as { belajar?: Langkah; dalam?: number } | null)?.belajar ?? {
        mapel: null,
        topik: null,
        kelas: false,
      }
      kedalaman.current = (e.state as { dalam?: number } | null)?.dalam ?? 0
      setGalat(null)
      const m = l.mapel ? mapel.find(x => x.subject_id === l.mapel) : null
      if (!m) {
        setDipilih(null)
        setTerpilih(null)
        return
      }
      buka(m, l)
    }
    window.addEventListener('popstate', pulihkan)
    return () => window.removeEventListener('popstate', pulihkan)
  }, [mapel, buka])

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
    // Penanda memuat menggantikan ikonnya, bukan menumpang di sebelahnya:
    // yang perlu dijawab layar ini cuma "ketukanku masuk atau tidak", dan
    // jawabannya harus muncul persis di kartu yang diketuk.
    const sedang = memuat === m.subject_id

    const ikon = sedang ? (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
        <Pemutar className="h-6 w-6 text-blue-600" />
      </span>
    ) : (
      <IkonMapel
        nama={m.subject_name}
        persen={dikerjakan == null ? null : (dikerjakan / angka.question_count) * 100}
      />
    )
    const judul = (
      <span className="block font-semibold tracking-tight text-gray-900">{m.subject_name}</span>
    )
    {/* Kemajuannya menumpang di angka soal, tanpa baris kedua yang mendorong
        hitungan materi ke seberang kartu. Kata "dikerjakan" WAJIB ikut: "11/31
        soal" sendirian terbaca sebagai "cuma 11 yang ada dari 31 yang tercatat"
        — pecahan di sebelah kata benda memang lebih sering berarti "sekian
        dari sekian yang tersedia". Satu kata itu yang membedakannya, dan
        bunyinya sama dengan yang tertulis di baris topik. */}
    const hitungan = (
      <span className="mt-0.5 block text-xs text-gray-400">
        {sedang
          ? 'Membuka…'
          : (
            <>
              {dikerjakan == null
                ? `${angka.question_count} soal`
                : `${dikerjakan}/${angka.question_count} soal dikerjakan`}
              {` · ${angka.materi_count} materi`}
              {angka.video_count > 0 && ` · ${angka.video_count} video`}
            </>
          )}
      </span>
    )

    return (
      <button
        key={`${awalan}-${m.subject_id}`}
        type="button"
        // Yang ditahan cuma ketukan KEDUA selagi yang pertama berjalan; kartunya
        // sendiri tidak diredupkan, karena kartu yang sedang dibuka sudah punya
        // penanda sendiri dan sisanya tidak sedang mengerjakan apa-apa.
        disabled={memuat !== null && !sedang}
        onClick={() => pilihMapel(m, awalan === 'kelas')}
        className={`flex w-full rounded-xl bg-white p-4 shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-50 disabled:opacity-60 ${
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

  // Alamat yang sudah menyebut mapel atau topik, isinya belum sampai. Yang
  // BELUM boleh muncul di sela itu adalah daftar mapel: ia layar yang sah,
  // jadi kedipnya tidak terbaca sebagai "sedang memuat" melainkan sebagai
  // langkah yang hilang — dan sepersekian detik kemudian layar melompat lagi.
  if (awal && !dipilih && memuat !== null) {
    return (
      <div className="space-y-4" aria-busy>
        <span className="sr-only">Membuka topiknya…</span>
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-kartu">
          <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-white shadow-kartu" />
      </div>
    )
  }

  if (mapel.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-kartu">
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
    const kata = normal(cariMapel)
    const cocok = kata ? mapel.filter(m => normal(m.subject_name).includes(kata)) : []

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

        <Pencarian
          nilai={cariMapel}
          ubah={setCariMapel}
          petunjuk="Cari mapel"
        />

        {/* Selagi ada yang dicari, kedua segmen menyingkir. Katalog yang tetap
            berdiri di bawah hasil pencarian membuat orang menggulung melewati
            jawaban yang sudah ia minta. */}
        {kata ? (
          cocok.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-kartu">
              Tidak ada mapel bernama “{cariMapel.trim()}”.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {/* Angka seluruh jenjang, seperti di katalog: pencarian tidak
                  membatasi diri pada kelas si anak, jadi angkanya pun tidak. */}
              {cocok.map(m => kartuMapel(m, m, 'cari'))}
            </div>
          )
        ) : (
          <>
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
          </>
        )}
      </div>
    )
  }

  // TIDAK disaring di sini. Dulu baris ini membuang topik yang nol soal — dan
  // karena tidak ada satu pun topik yang punya soal sekaligus materi, seluruh 53
  // materi yang sudah dikumpulkan tidak bisa dicapai siapa pun. Yang belum
  // lengkap sekarang disebutkan, bukan disembunyikan: setiap topik seharusnya
  // punya keduanya, dan daftar yang diam soal yang belum ada cuma memindahkan
  // kejutannya ke orang tua. Topik tanpa soal tidak ikut saringan status —
  // lihat `lolos()` — jadi yang mencari sesuatu untuk dikerjakan tidak
  // tersandung padanya, dan yang mencari bahan bacaan tetap menemukannya.
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

  /**
   * Kemajuan sebuah topik — DUA hal, dan sengaja tidak dilebur jadi satu angka.
   *
   * Bilahnya CAKUPAN: berapa soal dari berapa yang sudah dikerjakan. Cuma itu
   * yang benar-benar berbentuk "sekian dari sekian", dan cuma itu yang pantas
   * digambar sebagai bilah yang terisi.
   *
   * Persennya PENGUASAAN atas seluruh soal topik (`score` dibagi
   * `max_available`, migrasi 129) — yang belum dikerjakan terhitung belum
   * dikuasai. Sejak migrasi 134 hanya putaran yang SELESAI yang dihitung, jadi
   * paket yang ditinggalkan di tengah tidak menggeser apa pun.
   *
   * Tidak muncul sama sekali kalau belum ada yang dikerjakan — alasan yang
   * sama dengan cincin di kartu mapel. "0/12 · 0%" sebagai kabar pertama
   * tentang sebuah topik cuma menegaskan bahwa anaknya belum berbuat apa-apa,
   * dengan nada yang tidak ia minta.
   *
   * TANPA label rubrik ("Kurang", "Istimewa"). Menilai adalah pekerjaan
   * halaman Penguasaan di portal keluarga, dan ini layar tempat seorang anak
   * MEMILIH apa yang mau dikerjakan — deretan penghakiman di setiap baris
   * daftar bukan yang ia butuhkan untuk memilih, dan satu kata penilaian yang
   * sama muncul di dua layar dengan maksud berbeda cepat kehilangan artinya di
   * keduanya. Angkanya tetap di sini: itu yang menjawab "mana yang perlu
   * kuulang".
   *
   * `rinci` menambahkan kenaikannya. Di baris daftar ia dilepas: barisnya sudah
   * memuat tema, nama, angka soal, dan cakupan, dan kalimat kelima di sana
   * membuat semuanya sama-sama tidak terbaca. Di kartu topik yang terbuka,
   * tempatnya cukup dan justru itu yang ingin dibaca.
   */
  function kemajuan(t: TopikLatihan, rinci = false) {
    const dikerjakan = t.answered_count
    if (!dikerjakan || t.question_count === 0) return null
    const persen = t.max_available > 0 ? persenDari(t.score, t.max_available) : null
    // Nilai pertama tiap soal, dan hanya disebut kalau memang BERBEDA dari
    // sekarang — yaitu kalau ada soal yang diulang. Anak yang mengulang setelah
    // membaca pembahasan naik dari 10% ke 100%, dan angka 100% sendirian
    // menyembunyikan justru bagian yang paling layak dibaca orang tuanya.
    const awal =
      t.max_available > 0 && t.first_score !== t.score
        ? persenDari(t.first_score, t.max_available)
        : null
    const rincian = {
      correct: t.correct,
      partial: t.partial,
      wrong: t.wrong,
      belum: Math.max(0, t.question_count - dikerjakan),
    }
    return (
      <span className="mt-1.5 block">
        <span className="flex items-center gap-2">
          <BilahJawaban rincian={rincian} total={t.question_count} className="flex-1" />
          <span className="shrink-0 text-xs text-gray-500">
            {dikerjakan}/{t.question_count} dikerjakan
            {persen != null && ` · ${persen}% benar`}
          </span>
        </span>
        {/* Berapa benar dan berapa salah — di baris daftar itu kalimat kelima
            dan membuat semuanya sama-sama tidak terbaca, tapi di kartu topik
            yang terbuka justru itu yang dicari sebelum menekan "Ulangi". */}
        {rinci && (
          <>
            <KeteranganJawaban rincian={rincian} className="mt-2.5" />
            {awal != null && persen != null && (
              <span className="mt-2 block text-xs text-gray-400">
                {awal < persen
                  ? `Naik dari ${awal}% saat soal-soalnya pertama dijawab.`
                  : `Saat pertama dijawab ${awal}%.`}
              </span>
            )}
          </>
        )}
      </span>
    )
  }

  // Langkah ketiga: satu topik terbuka, bahannya di layar, satu tombol. Materi
  // muncul SETELAH topiknya diketuk, bukan tergeletak di bawah daftar —
  // menumpahkan seluruh bahan mapel ke layar bukan menolong siapa pun.
  if (terpilih) {
    const materiTopik = materi.filter(m => m.group_id === terpilih.group_id)
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-white p-4 shadow-kartu">
          <p className="text-xs text-gray-400">
            {dipilih.subject_name} · {terpilih.grade_level}
            {terpilih.theme ? ` · ${terpilih.theme}` : ''}
          </p>
          <p className="mt-0.5 font-semibold tracking-tight text-gray-900">{terpilih.topic}</p>
          <p className="mt-0.5 text-xs text-gray-400">{keterangan(terpilih)}</p>
          {kemajuan(terpilih, true)}
        </div>

        <Materi materi={materiTopik} />

        {galat && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
            {galat}
          </p>
        )}

        {/* Paketnya, bukan satu tombol "Mulai Latihan". Isi tiap paket TETAP —
            potongan bank soal topik ini, sepuluh-sepuluh — jadi yang dipilih
            anak bukan "sepuluh soal entah yang mana" melainkan bagian mana dari
            topik ini yang mau ia hadapi, dan bagian mana yang sudah selesai. */}
        <DaftarPaket anak={anak} groupId={terpilih.group_id} jumlahSoal={terpilih.question_count} />
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
  const dalamLingkup = lingkupKelas
    ? tersedia.filter(t => jenjang.includes(t.grade_level))
    : tersedia
  const kataTopik = normal(cariTopik)
  const lolos = (t: TopikLatihan) => {
    if (saringan !== 'semua') {
      // Ketiga saringan status bertanya tentang PENGERJAAN, jadi dua keadaan
      // dilewati semuanya, bukan dipaksa masuk salah satu:
      //
      // - Topik tanpa soal tidak punya status. "Menunggu" untuk topik yang
      //   tidak punya apa pun untuk dikerjakan adalah janji yang tidak bisa
      //   ditepati; bahannya tetap terbaca lewat "Semua".
      // - Kemajuan yang tidak diketahui (`answered_count` null, kuerinya
      //   gagal) tidak boleh mengaku "Menunggu". Yang tidak kita ketahui tidak
      //   kita namai — barisnya tetap ada di "Semua".
      if (t.question_count === 0 || t.answered_count == null) return false
      const dikerjakan = t.answered_count
      if (saringan === 'menunggu' && dikerjakan > 0) return false
      if (saringan === 'proses' && (dikerjakan === 0 || dikerjakan >= t.question_count))
        return false
      if (saringan === 'selesai' && dikerjakan < t.question_count) return false
    }
    if (kataTopik && !normal(t.topic).includes(kataTopik) && !normal(t.theme ?? '').includes(kataTopik))
      return false
    return true
  }
  const tersaring = dalamLingkup.filter(lolos)

  function barisTopik(t: TopikLatihan, denganJenjang = false) {
    return (
      <button
        key={t.group_id}
        type="button"
        onClick={() => pilihTopik(t)}
        className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-50"
      >
        <span className="min-w-0 flex-1">
          {/* Tema di ATAS namanya, sebagai label: ia yang memberi tahu topik ini
              bagian dari apa, dan sebagai ekor di baris angka ia terbaca seolah
              salah satu hitungan. Di hasil pencarian jenjangnya ikut di sini —
              daftarnya datar, jadi tidak ada judul kelompok yang menyebutkannya. */}
          {(denganJenjang || t.theme) && (
            <span className="block truncate text-xs text-gray-400">
              {[denganJenjang ? t.grade_level : null, t.theme].filter(Boolean).join(' · ')}
            </span>
          )}
          <span className="block font-semibold tracking-tight text-gray-900">{t.topic}</span>
          {/* Semester sengaja tidak ditampilkan: untuk kurikulum seperti TKA
              yang tidak mengenal semester, angkanya cuma kebisingan. Jenjangnya
              tidak lagi disembunyikan — sejak daftar ini dikelompokkan, justru
              itu yang membuat anak tahu baris mana miliknya. */}
          <span className="mt-0.5 block truncate text-xs text-gray-400">{keterangan(t)}</span>
          {kemajuan(t)}
        </span>
        <Panah className="h-4 w-4 shrink-0 text-gray-300" />
      </button>
    )
  }

  const perKelas = new Map<string, TopikLatihan[]>()
  for (const t of tersaring) {
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
          {daftar.map(t => barisTopik(t))}
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
        <div className="flex flex-col gap-2">{daftar.map(t => barisTopik(t))}</div>
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
          <Panah className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
          <span className="text-gray-700">{label}</span>
          <span className="text-xs text-gray-400">{daftar.length} topik</span>
        </summary>
        <div className="flex flex-col gap-2 pb-4">{daftar.map(t => barisTopik(t))}</div>
      </details>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pencarian dan saringan di atas daftar, bukan di dalam salah satu
          kelompoknya: keduanya berlaku untuk seluruh isi mapel ini, termasuk
          jenjang yang sedang terlipat. */}
      {tersedia.length > 0 && (
        <div className="space-y-2">
          <Pencarian nilai={cariTopik} ubah={setCariTopik} petunjuk="Cari topik" />
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {SARINGAN.map(s => (
              <button
                key={s.nilai}
                type="button"
                onClick={() => setSaringan(s.nilai)}
                aria-pressed={saringan === s.nilai}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  saringan === s.nilai
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 shadow-kartu hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tersedia.length === 0 && (
        <p className="text-sm text-gray-500">Belum ada topik di mapel ini.</p>
      )}

      {tersedia.length > 0 && tersaring.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-500 shadow-kartu">
          {/* Yang disebut alasan yang SEBENARNYA. "Tidak ada topik bernama X"
              sementara yang membuang barisnya justru saringan yang menyala
              membuat orang mengetik ulang kata yang sudah benar. */}
          {kataTopik && saringan !== 'semua'
            ? `Tidak ada topik “${cariTopik.trim()}” yang lolos saringan ini.`
            : kataTopik
              ? `Tidak ada topik yang cocok dengan “${cariTopik.trim()}”.`
              : saringan !== 'semua'
                ? KOSONG[saringan]
                : 'Tidak ada topik yang cocok dengan saringan ini.'}
        </p>
      )}

      {/* Sedang mencari ATAU menyaring berarti daftarnya DATAR: pengelompokan
          per jenjang menjawab "aku di mana", sementara pencarian dan saringan
          menjawab "di mana yang begini" — dan jawaban itu tidak boleh terkubur
          di dalam kelompok yang terlipat. Menyaring "Selesai" lalu disodori
          sembilan kelompok tertutup adalah pertanyaan yang dijawab dengan
          pekerjaan rumah. Jenjangnya pindah ke barisnya masing-masing. */}
      {kataTopik || saringan !== 'semua' ? (
        <div className="flex flex-col gap-2">{tersaring.map(t => barisTopik(t, true))}</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

/**
 * Saringan daftar topik, menurut keadaan PENGERJAANNYA:
 *
 *   Menunggu  belum satu soal pun dijawab
 *   Proses    sebagian sudah, sisanya belum
 *   Selesai   seluruh soalnya sudah pernah dijawab
 *
 * Tiga keadaan yang saling meniadakan, bukan dua saringan yang bertanya soal
 * berbeda seperti sebelumnya ("Belum dikerjakan" dan "Ada soalnya" bisa
 * menyala bersama-sama dan tidak jelas apa artinya bersama). Yang dicari anak
 * di layar ini biasanya salah satu dari tiga: mulai yang baru, lanjutkan yang
 * tanggung, atau tengok yang sudah kelar.
 *
 * "Selesai" berkata SUDAH DIKERJAKAN, bukan sudah dikuasai — seberapa
 * dikuasainya dijawab persen dan labelnya di baris itu sendiri, dan dua kabar
 * berbeda tidak boleh berbagi satu kata.
 */
type Saringan = 'semua' | 'menunggu' | 'proses' | 'selesai'

const SARINGAN: { nilai: Saringan; label: string }[] = [
  { nilai: 'semua', label: 'Semua' },
  { nilai: 'menunggu', label: 'Menunggu' },
  { nilai: 'proses', label: 'Proses' },
  { nilai: 'selesai', label: 'Selesai' },
]

/** Kalimat untuk daftar yang kosong karena saringannya, per saringan. */
const KOSONG: Record<Exclude<Saringan, 'semua'>, string> = {
  menunggu: 'Semua topik di sini sudah mulai dikerjakan.',
  proses: 'Tidak ada topik yang baru dikerjakan sebagian.',
  selesai: 'Belum ada topik yang seluruh soalnya sudah dikerjakan.',
}

/** Kotak cari yang sama untuk mapel dan topik, lengkap dengan tombol hapusnya. */
function Pencarian({
  nilai,
  ubah,
  petunjuk,
}: {
  nilai: string
  ubah: (teks: string) => void
  petunjuk: string
}) {
  return (
    <div className="relative">
      <input
        type="search"
        value={nilai}
        onChange={e => ubah(e.target.value)}
        placeholder={petunjuk}
        aria-label={petunjuk}
        // Tombol hapus bawaan peramban disembunyikan: kotak ini sudah punya
        // tombolnya sendiri, dan dua silang berdampingan di ujung yang sama
        // bukan pilihan melainkan kebingungan.
        className="w-full rounded-xl bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 shadow-kartu outline-none ring-blue-500 placeholder:text-gray-400 focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      {nilai && (
        <button
          type="button"
          onClick={() => ubah('')}
          aria-label="Hapus pencarian"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:text-gray-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  )
}
