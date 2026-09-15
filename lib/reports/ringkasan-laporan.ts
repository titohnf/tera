import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'
import { coversSession } from '@/lib/enrollment'
import { monthRange } from '@/lib/reports/laporan-bulanan'
import { learnerAnak, kemajuanTopik, type KemajuanTopik } from '@/lib/belajar/sesi'
import { kemajuanTopikPeta, type KemajuanTopikPeta } from '@/lib/belajar/topik-rapor'
import { persenDari } from '@/lib/belajar/penilaian'

/**
 * Rangkuman ketiga laporan seorang anak — isi halaman `/rapor`.
 *
 * Halaman Laporan dulu tiga tab yang disatukan sebuah bilah. Bilah itu memaksa
 * orang tua memilih sebelum diberi tahu apa pun, dan tiga tab yang berisi tiga
 * daftar panjang tidak pernah menjawab pertanyaan yang membawa mereka ke sana:
 * "anak saya bagaimana". Sekarang pintu masuknya sebuah halaman rangkuman, dan
 * ketiga laporan jadi kartu yang dibuka kalau memang mau ditelusuri.
 *
 * Yang dirangkum di sini SENGAJA dipecah per mapel, bukan diringkas jadi satu
 * angka per laporan. Satu angka gabungan menuntut penyebut gabungan, dan tiga
 * laporan ini justru ada karena penyebutnya berlainan — kehadiran per sesi, bab
 * kurikulum per soal, paket peta per paket. Yang bisa dijumlahkan cuma yang
 * satu jenis, dan mapel adalah batas alaminya.
 *
 * Ketiganya membaca periode yang BERBEDA, dan itu harus tertulis di layar:
 * rangkuman kelas membaca SELURUH riwayat sementara halaman Progres Kelas
 * membaca satu bulan, jadi angka di kartu dan angka di dalamnya memang tidak
 * akan sama. Menyamakannya berarti membuang pertanyaan "mapel apa saja yang
 * pernah dipelajari anak ini", yang justru pertanyaan halaman rangkuman.
 *
 * DIHITUNG SAAT BACA, bukan disimpan. Tabel ringkasan akan jadi sumber
 * kebenaran keempat yang bisa hanyut dari ketiga sumber aslinya — persis kelas
 * bug yang sudah dua kali dibayar halaman Penguasaan (dan migrasi 128).
 *
 * MEMAKAI ADMIN CLIENT untuk bagian kelasnya, sama seperti
 * `getLaporanBulananData`. Pemanggilnya WAJIB sudah memastikan anak ini milik
 * keluarga yang sedang masuk lewat `anakOrRedirect()`; fungsi ini tidak
 * memeriksanya sendiri.
 */

/** Satu mapel di rangkuman Progres Kelas, sepanjang semester berjalan. */
export interface RangkumanKelas {
  mapel: string
  /** Cacah sesi selesai; tidak ditampilkan, dipakai mengurutkan mapel. */
  sesi: number
  /** Rata-rata nilai asesmen dalam persen; null kalau belum ada yang dinilai. */
  rataRata: number | null
  /**
   * Rata-rata nilai tiap bulan pada jendela grafik, sejajar dengan
   * `bulanLabel` dan urut dari yang terlama. `null` berarti bulan itu tidak
   * punya asesmen yang dinilai — dan harus tetap null, bukan nol: garis yang
   * turun ke dasar mengabarkan nilai buruk untuk bulan yang sebenarnya sepi.
   */
  nilaiBulanan: (number | null)[]
}

/**
 * Satu mapel di rangkuman Latihan Mandiri.
 *
 * `rataRata` yang null adalah penanda "belum disentuh sama sekali": ia dihitung
 * dari topik yang pernah dijawab, jadi tidak ada cara ia terisi tanpa anaknya
 * mengerjakan sesuatu. Halaman memakainya untuk memilih antara daftar dan satu
 * kalimat kosong.
 */
export interface RangkumanMandiri {
  mapel: string
  /** Topik yang SELURUH soalnya sudah dikerjakan — cakupan, bukan mutu. */
  selesai: number
  topik: number
  /** Rata-rata penguasaan topik yang pernah disentuh; null kalau belum ada. */
  rataRata: number | null
}

/** Rangkuman Ketuntasan Materi. Hari ini peta kompetensi cuma Matematika. */
export interface RangkumanKetuntasan {
  mapel: string
  /**
   * Jenjang TERTINGGI yang seluruh topiknya sudah tuntas, apa adanya dari
   * `topik.jenjang_kelas` (bisa rentang seperti "7-8"). Null berarti belum ada
   * satu jenjang pun yang penuh — dan itu harus dikatakan begitu, bukan
   * dibulatkan ke bawah jadi klaim yang tidak dimiliki anaknya.
   */
  levelKelas: string | null
  /**
   * Topik yang PERNAH DISENTUH. Nol berarti anaknya belum mengerjakan apa pun
   * di peta ini — keadaan yang harus dijawab dengan satu kalimat, bukan dengan
   * tangga jenjang yang seluruh barisnya nol. Deretan "0/6" bukan kabar; ia
   * cuma menyuruh pembacanya menyimpulkan sendiri bahwa belum ada apa-apa.
   */
  dikerjakan: number
  tuntas: number
  topik: number
  /**
   * Ketuntasan per jenjang, dari yang terendah. Inilah yang membuat kalimat
   * "berada di level kelas X" bisa DIPERIKSA alih-alih dipercaya: pembacanya
   * melihat sendiri jenjang mana yang penuh dan mana yang baru separuh.
   */
  jenjang: { label: string; tuntas: number; topik: number }[]
}

export interface RangkumanLaporan {
  kelas: RangkumanKelas[] | null
  /** Bulan-bulan semester berjalan sampai bulan ini, terlama dulu. */
  bulanLabel: string[]
  /**
   * "kelas 7 semester 1 T.A. 2026/2027" — periode DAN jenjang yang dicakup
   * kartu Progres Kelas. Jenjangnya ikut karena kalimat yang dipakai orang tua
   * memang menyebut keduanya sekaligus; kalau jenjangnya tidak tercatat,
   * bagiannya hilang dan sisanya tetap kalimat yang benar.
   */
  semesterLabel: string
  mandiri: RangkumanMandiri[] | null
  ketuntasan: RangkumanKetuntasan | null
}

export async function rangkumanLaporan(
  studentId: string,
  sekarang: { tahun: number; bulan: number },
): Promise<RangkumanLaporan> {
  const s = semesterBerjalan(sekarang)
  const [kelas, latihan, jenjang] = await Promise.all([
    rangkumanKelas(studentId, s.bulan),
    rangkumanLatihan(studentId),
    jenjangSiswa(studentId),
  ])
  return {
    kelas,
    bulanLabel: s.bulan.map(namaBulanPendek),
    semesterLabel: [jenjang, s.label].filter(Boolean).join(' '),
    ...latihan,
  }
}

/**
 * "kelas 7", atau jenjang teksnya kalau kelasnya tidak berangka, atau kosong.
 *
 * Kosong bukan galat: sebagian murid tercatat tanpa kelas, dan kalimat yang
 * kehilangan bagian ini masih kalimat yang benar. Mengarang "kelas -" jauh
 * lebih buruk daripada tidak menyebutnya.
 */
async function jenjangSiswa(studentId: string): Promise<string> {
  const { data } = await createAdminClient()
    .from('profiles')
    .select('grade, level')
    .eq('id', studentId)
    .maybeSingle()

  const grade = (data as { grade: string | null; level: string | null } | null)?.grade
  if (grade) return `di kelas ${grade}`
  const level = (data as { grade: string | null; level: string | null } | null)?.level
  return level ? `di ${level}` : ''
}

/**
 * Semester berjalan menurut kalender sekolah Indonesia, beserta bulan-bulannya
 * sampai bulan ini.
 *
 * Kartu Progres Kelas SEMESTERAN, bukan "enam bulan terakhir". Keduanya
 * sama-sama enam bulan dan justru itu yang menyesatkan: pada September, enam
 * bulan terakhir adalah April–September, dan April sampai Juni ada di semester
 * SEBELUMNYA. Melabeli jendela berjalan dengan nama semester berarti menjanjikan
 * periode yang bukan isinya — dan yang membaca label itu adalah orang tua yang
 * tahu persis kapan anaknya masuk semester baru.
 *
 * Akibatnya jendelanya MEMENDEK di awal semester: pada Juli ia cuma satu bulan,
 * dan grafiknya cuma satu titik. Itu memang keadaannya; sebuah semester yang
 * baru berjalan sebulan tidak punya tren untuk digambar, dan memanjangkannya
 * dengan bulan dari semester lalu cuma menggambar tren yang bukan miliknya.
 *
 * Bulan-bulannya selalu bagian dari enam bulan terakhir, jadi tiap bulan di
 * grafik tetap bisa dibuka lewat pemilih bulan di halaman Progres Kelas.
 */
export function semesterBerjalan(sekarang: { tahun: number; bulan: number }): {
  label: string
  /** `YYYY-MM`, terlama dulu, sampai bulan berjalan. */
  bulan: string[]
} {
  // Ganjil Juli–Desember, genap Januari–Juni. Tahun ajaran dinamai dari tahun
  // Juli-nya: Januari 2027 masih T.A. 2026/2027.
  const ganjil = sekarang.bulan >= 7
  const mulai = ganjil ? 7 : 1
  const awalTa = ganjil ? sekarang.tahun : sekarang.tahun - 1

  const bulan: string[] = []
  for (let m = mulai; m <= sekarang.bulan; m++) {
    bulan.push(`${sekarang.tahun}-${String(m).padStart(2, '0')}`)
  }

  return {
    label: `semester ${ganjil ? 1 : 2} T.A. ${awalTa}/${awalTa + 1}`,
    bulan,
  }
}

/** "2026-08" → "Agu". Sependek mungkin: sampai enam label harus muat di 390px. */
function namaBulanPendek(bulan: string): string {
  const [tahun, ke] = bulan.split('-').map(Number)
  return new Date(Date.UTC(tahun, ke - 1, 1)).toLocaleDateString('id-ID', {
    month: 'short',
    timeZone: 'UTC',
  })
}

/* -------------------------------------------------------------------------
 * Progres Kelas — seluruh riwayat, per mapel
 * ---------------------------------------------------------------------- */

async function rangkumanKelas(
  studentId: string,
  bulan: string[],
): Promise<RangkumanKelas[] | null> {
  const admin = createAdminClient()

  type EnrollRow = {
    enrolled_at: string | null
    unenrolled_at: string | null
    is_active: boolean
    classes: { id: string } | null
  }
  const { data: enrollData } = (await admin
    .from('class_students')
    .select('enrolled_at, unenrolled_at, is_active, classes(id)')
    .eq('student_id', studentId)) as unknown as { data: EnrollRow[] | null }

  const enrollments = (enrollData ?? []).filter(e => e.classes !== null)
  if (enrollments.length === 0) return null

  const jendelaKelas = new Map(enrollments.map(e => [e.classes!.id, e]))

  type SesiRow = {
    id: string
    class_id: string
    scheduled_at: string
    subjects: { name: string } | null
  }
  // Dibatasi ke SEMESTER BERJALAN, bukan seluruh riwayat. Kartunya berkata
  // "sejak masuk semester ...", jadi angkanya harus benar-benar dari sana —
  // rata-rata seumur hidup di bawah label semester adalah kalimat yang tidak
  // bisa dipertahankan. Batasnya dipasang di kueri, bukan disaring sesudahnya:
  // anak yang sudah tiga tahun bergabung tidak perlu seluruh sesinya ditarik
  // untuk merangkum satu semester.
  const { startIso } = monthRange(bulan[0])
  const { endIso } = monthRange(bulan[bulan.length - 1])

  const { data: sesiData } = (await admin
    .from('sessions')
    .select('id, class_id, scheduled_at, subjects(name)')
    .in('class_id', [...jendelaKelas.keys()])
    .eq('status', 'completed')
    .gte('scheduled_at', startIso)
    .lt('scheduled_at', endIso)) as unknown as { data: SesiRow[] | null }

  // Sesi di luar masa anak ini ikut kelasnya dibuang, aturan yang sama dengan
  // `getLaporanBulananData`: siswa yang baru masuk Agustus tidak boleh membawa
  // sesi Juli ke laporannya.
  const sesi = (sesiData ?? []).filter(s => {
    const jendela = jendelaKelas.get(s.class_id)
    return jendela ? coversSession(jendela, s.scheduled_at) : false
  })
  if (sesi.length === 0) return []

  const sesiIds = sesi.map(s => s.id)

  // Kehadiran TIDAK dibaca di sini. Kartu rapor cuma menyebut rata-rata nilai
  // per mapel; angka hadir/sesi hidup di halaman Progres Kelas yang dituju
  // kartunya. Sebuah kueri untuk kolom yang tidak pernah digambar adalah
  // ongkos yang dibayar tiap kunjungan tanpa ada yang menerimanya.
  const { data: asesmenData } = (await admin
    .from('assessments')
    .select('id, session_id, max_score')
    .in('session_id', sesiIds)) as unknown as {
    data: { id: string; session_id: string; max_score: number }[] | null
  }

  const asesmen = asesmenData ?? []
  const { data: nilaiData } =
    asesmen.length > 0
      ? ((await admin
          .from('assessment_results')
          .select('assessment_id, score')
          .eq('student_id', studentId)
          .in(
            'assessment_id',
            asesmen.map(a => a.id),
          )) as unknown as { data: { assessment_id: string; score: number | null }[] | null })
      : { data: [] as { assessment_id: string; score: number | null }[] }

  const nilai = new Map((nilaiData ?? []).map(n => [n.assessment_id, n.score]))
  const mapelSesi = new Map(sesi.map(s => [s.id, s.subjects?.name ?? 'Tanpa mapel']))
  const isoSesi = new Map(sesi.map(s => [s.id, s.scheduled_at]))

  type Akumulasi = {
    sesi: number
    total: number
    jumlah: number
    /** Sejajar `bulan`: [jumlah persen, cacah asesmen] tiap bulan. */
    perBulan: [number, number][]
  }
  const per = new Map<string, Akumulasi>()
  const ambil = (mapel: string) => {
    const ada: Akumulasi = per.get(mapel) ?? {
      sesi: 0,
      total: 0,
      jumlah: 0,
      perBulan: bulan.map(() => [0, 0] as [number, number]),
    }
    per.set(mapel, ada)
    return ada
  }

  // Bulan sebuah sesi, dibaca dengan cara yang sama dengan `monthRange()` di
  // `laporan-bulanan.ts` — waktu lokal server. Dua tempat yang mengelompokkan
  // sesi yang sama ke bulan yang berbeda adalah selisih yang tidak akan pernah
  // bisa dijelaskan ke siapa pun.
  const indeksBulan = new Map(bulan.map((b, i) => [b, i]))
  const bulanSesi = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  for (const s of sesi) {
    ambil(mapelSesi.get(s.id)!).sesi += 1
  }

  for (const a of asesmen) {
    const skor = nilai.get(a.id)
    if (skor == null || a.max_score <= 0) continue
    const mapel = mapelSesi.get(a.session_id)
    if (!mapel) continue
    const baris = ambil(mapel)
    const persen = (skor / a.max_score) * 100
    baris.total += persen
    baris.jumlah += 1

    // Sesi yang ditarik sudah sebatas semesternya, jadi tiap asesmen pasti
    // punya bulannya di sini. Penjaganya tetap dipasang: `indeksBulan` yang
    // meleset lebih baik melewatkan satu titik daripada melempar.
    const iso = isoSesi.get(a.session_id)
    const i = iso === undefined ? undefined : indeksBulan.get(bulanSesi(iso))
    if (i !== undefined) {
      baris.perBulan[i][0] += persen
      baris.perBulan[i][1] += 1
    }
  }

  return [...per.entries()]
    .map(([mapel, v]) => ({
      mapel,
      sesi: v.sesi,
      rataRata: v.jumlah > 0 ? Math.round(v.total / v.jumlah) : null,
      nilaiBulanan: v.perBulan.map(([jumlah, cacah]) =>
        cacah > 0 ? Math.round(jumlah / cacah) : null,
      ),
    }))
    .sort((a, b) => b.sesi - a.sesi || a.mapel.localeCompare(b.mapel, 'id'))
}

/* -------------------------------------------------------------------------
 * Latihan Mandiri dan Ketuntasan Materi
 * ---------------------------------------------------------------------- */

async function rangkumanLatihan(studentId: string): Promise<{
  mandiri: RangkumanMandiri[] | null
  ketuntasan: RangkumanKetuntasan | null
}> {
  // `learnerAnak()` cuma MEMBACA. Memakai `belajarContext()` di sini akan
  // melahirkan baris `learners` untuk anak yang kebetulan rapornya dibuka
  // orang tuanya — laporan tidak berhak melahirkan apa pun.
  const learnerId = await learnerAnak(studentId)
  if (!learnerId) return { mandiri: [], ketuntasan: null }

  const [mandiri, peta] = await Promise.all([kemajuanTopik(learnerId), kemajuanTopikPeta(learnerId)])

  return {
    mandiri: mandiri === null ? null : await mandiriPerMapel(mandiri),
    ketuntasan: peta === null ? null : ketuntasanPeta(peta),
  }
}

async function mandiriPerMapel(
  kemajuan: KemajuanTopik[],
): Promise<RangkumanMandiri[]> {
  if (kemajuan.length === 0) return []

  // SELURUH grup dibaca, bukan hanya yang dikerjakan — dan justru itu bedanya
  // dengan halaman Latihan Mandiri, yang sengaja membaca seukuran anaknya.
  // Di sana yang dibutuhkan cuma NAMA beberapa topik; di sini yang dibutuhkan
  // PENYEBUT tiap mapel, dan penyebut tidak bisa dihitung dari sebagian.
  // Dua kolom untuk beberapa ratus baris, sekali per kunjungan halaman rapor.
  const supabase = await createClient()
  const { data } = await supabase
    .from('curriculum_topic_groups')
    .select('id, subject_id, subjects(name)')

  type GrupRow = { id: string; subject_id: string | null; subjects: { name: string } | null }
  const grup = new Map(
    ((data as GrupRow[] | null) ?? []).map(g => [g.id, g.subjects?.name ?? 'Tanpa mapel']),
  )

  const per = new Map<string, { selesai: number; topik: number; total: number; jumlah: number }>()
  for (const k of kemajuan) {
    const mapel = grup.get(k.group_id)
    // Grup yang tidak lagi ada di kurikulum tidak ikut jadi penyebut: ia tidak
    // bisa dinamai, dan mapel "Tanpa nama" di rangkuman cuma menimbulkan
    // pertanyaan yang tidak bisa dijawab layar ini.
    if (!mapel) continue
    const baris = per.get(mapel) ?? { selesai: 0, topik: 0, total: 0, jumlah: 0 }
    baris.topik += 1
    if (k.total > 0 && k.answered >= k.total) baris.selesai += 1
    // Rata-ratanya hanya dari topik yang PERNAH DISENTUH. Topik yang belum
    // dibuka bukan nilai nol — memasukkannya berarti anak yang mengerjakan
    // satu topik dengan sempurna tetap tampil sebagai 7%.
    if (k.answered > 0 && k.max_available > 0) {
      baris.total += persenDari(k.score, k.max_available)
      baris.jumlah += 1
    }
    per.set(mapel, baris)
  }

  return [...per.entries()]
    .map(([mapel, v]) => ({
      mapel,
      selesai: v.selesai,
      topik: v.topik,
      rataRata: v.jumlah > 0 ? Math.round(v.total / v.jumlah) : null,
    }))
    // Mapel yang belum disentuh sama sekali turun ke bawah; sisanya menurut
    // banyaknya topik yang sudah selesai.
    .sort((a, b) => b.selesai - a.selesai || a.mapel.localeCompare(b.mapel, 'id'))
}

function ketuntasanPeta(
  peta: KemajuanTopikPeta[],
): RangkumanKetuntasan | null {
  if (peta.length === 0) return null

  const tuntas = (k: KemajuanTopikPeta) => k.paketTotal > 0 && k.paketTuntas >= k.paketTotal

  // `jenjang_kelas` adalah TEKS dan boleh berupa RENTANG ("7-8") — lihat
  // migrasi 140, yang mengikuti kolom Kelas di Learning Progression.
  //
  // Topik rentang masuk ke KELAS ATASNYA, satu kali: "7-8" jadi kelas 8, "8-9"
  // jadi kelas 9. Tangganya dengan begitu tinggal kelas bulat, dan tiap topik
  // duduk di tepat satu baris — penyebut seluruh baris berjumlah persis
  // sebanyak topiknya, jadi tidak ada angka di layar yang perlu diterangkan
  // kenapa tidak bertemu.
  //
  // Ujung ATAS, bukan bawah, dan itu sejalan dengan aturan levelnya: topik yang
  // membentang 7–8 baru benar-benar selesai kalau bahan kelas 8-nya ikut
  // dikuasai, jadi menaruhnya di kelas 8 berarti kelas 8 tidak bisa disebut
  // penuh sebelum topik itu tuntas.
  //
  // Harganya, dan ini disengaja: kelas 7 jadi lebih mudah penuh karena topik
  // yang menyeberang tidak lagi menahannya. Yang menahan sekarang kelas
  // atasnya — tempat bahan itu memang diselesaikan.
  const kelasAtas = (s: string) => {
    const n = (s.match(/\d+/g) ?? []).map(Number)
    return n.length > 0 ? Math.max(...n) : null
  }

  const perJenjang = new Map<number, { tuntas: number; jumlah: number }>()
  for (const k of peta) {
    const kelas = kelasAtas(k.jenjangKelas)
    if (kelas === null) continue
    const ada = perJenjang.get(kelas) ?? { tuntas: 0, jumlah: 0 }
    ada.jumlah += 1
    if (tuntas(k)) ada.tuntas += 1
    perJenjang.set(kelas, ada)
  }

  // Kelas TERTINGGI yang SELURUH bahannya tuntas — bacaan paling keras kepala
  // dari beberapa yang mungkin, dan dipilih justru karena itu: "berada di level
  // kelas 8" adalah kalimat yang akan dikutip orang tua, dan satu-satunya
  // bentuk yang bisa dipertahankan adalah yang tidak menyisakan satu pun bahan
  // kelas itu dalam keadaan tertinggal.
  const penuh = [...perJenjang.entries()]
    .filter(([, v]) => v.jumlah > 0 && v.tuntas === v.jumlah)
    .sort((a, b) => b[0] - a[0])

  return {
    // Peta kompetensi hari ini cuma Matematika; namanya dipinjam dari kurikulum
    // lewat `subjectId`, dan kalau tidak ada pemetaannya kita tidak mengarang.
    mapel: 'Matematika',
    levelKelas: penuh[0] ? String(penuh[0][0]) : null,
    dikerjakan: peta.filter(k => k.answered > 0).length,
    tuntas: peta.filter(tuntas).length,
    topik: peta.length,
    // Dari kelas terendah ke tertinggi — arah orang membaca tangga kelas, dan
    // arah anaknya menaikinya.
    jenjang: [...perJenjang.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([kelas, v]) => ({ label: String(kelas), tuntas: v.tuntas, topik: v.jumlah })),
  }
}
