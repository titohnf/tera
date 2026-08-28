import { createClient } from '@/lib/supabase/server'
import { coversSession } from '@/lib/enrollment'
import { tagihanTerlambat, tanggalBayarTerakhir } from '@/lib/tagihan'

/**
 * Kelas dan sesi seorang anak, dirakit sekali untuk dipakai beberapa halaman
 * portal keluarga.
 *
 * Sampai sebelum ini semuanya tinggal di badan `app/keluarga/[studentId]/page.tsx`,
 * karena memang cuma satu halaman yang memerlukannya. Begitu halaman bertab itu
 * dipecah jadi Beranda, Jadwal, dan Profil, kuerinya harus disalin ke tiga
 * tempat — dan salinan yang paling gampang menyimpang justru saringan
 * `coversSession` di bawah: yang lupa memasangnya akan menampilkan sesi kelas
 * dari masa sebelum anaknya bergabung, lalu persentase kehadirannya berbeda
 * dengan yang dilihat admin.
 *
 * Semua kuerinya lewat klien ber-RLS, sama seperti sisa portal ini (lihat
 * alasannya di `keluargaContext`).
 */

export type SesiAnak = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
  tutor_id: string | null
}

export type KelasAnak = {
  class_id: string
  is_active: boolean
  enrolled_at: string | null
  unenrolled_at: string | null
  classes: { name: string; schedule_days: number[] | null; schedule_time: string | null } | null
}

export async function muatKelasDanSesi(studentId: string) {
  const supabase = await createClient()

  const { data: kelasRows } = await supabase
    .from('class_students')
    .select('class_id, is_active, enrolled_at, unenrolled_at, classes(name, schedule_days, schedule_time)')
    .eq('student_id', studentId)

  const kelas = (kelasRows ?? []) as unknown as KelasAnak[]
  const classIds = kelas.map((k) => k.class_id)

  const { data: sesiRows } = classIds.length
    ? await supabase
        .from('sessions')
        .select('id, class_id, scheduled_at, topic, status, subject_id, tutor_id')
        .in('class_id', classIds)
        .order('scheduled_at', { ascending: false })
    : { data: null }
  const semuaSesi = (sesiRows ?? []) as unknown as SesiAnak[]

  // Sesi di luar masa anak ini ikut kelasnya dibuang — aturan yang sama dengan
  // halaman detail siswa admin (`inWindow` di sana). Kelas hidup lebih lama
  // daripada keanggotaan muridnya: anak yang baru masuk Agustus tidak punya
  // urusan dengan sesi Juli kelasnya.
  const rentangKelas = new Map(kelas.map((k) => [k.class_id, k] as const))
  const sesi = semuaSesi.filter((s) => {
    const rentang = rentangKelas.get(s.class_id)
    return rentang ? coversSession(rentang, s.scheduled_at) : false
  })

  const { data: hadirRows } = await supabase
    .from('attendances')
    .select('session_id, status')
    .eq('student_id', studentId)
  const attendanceMap: Record<string, string> = {}
  for (const a of hadirRows ?? []) attendanceMap[a.session_id as string] = a.status as string

  const { data: mapelRows } = await supabase.from('subjects').select('id, name')
  const subjectNameMap: Record<string, string> = {}
  for (const m of mapelRows ?? []) subjectNameMap[m.id as string] = m.name as string

  const idTutor = [...new Set(sesi.map((s) => s.tutor_id).filter(Boolean))] as string[]
  const { data: tutorRows } = idTutor.length
    ? await supabase.from('profiles').select('id, full_name').in('id', idTutor)
    : { data: null }
  const namaTutor = new Map((tutorRows ?? []).map((t) => [t.id as string, t.full_name as string]))
  const sessionTutorMap: Record<string, string> = {}
  for (const s of sesi) if (s.tutor_id) sessionTutorMap[s.id] = namaTutor.get(s.tutor_id) ?? ''

  const kelasAktif = kelas.filter((k) => k.is_active)
  const kelasLampau = kelas.filter((k) => !k.is_active)
  const idKelasAktif = new Set(kelasAktif.map((k) => k.class_id))
  const sesiAktif = sesi.filter((s) => idKelasAktif.has(s.class_id))

  // Mapel per kelas disimpulkan dari sesinya — sama seperti yang dilakukan
  // halaman admin, karena kelas tidak menyimpan daftar mapelnya sendiri.
  const mapelPerKelas = new Map<string, string[]>()
  for (const s of sesi) {
    if (!s.subject_id) continue
    const nama = subjectNameMap[s.subject_id]
    if (!nama) continue
    const daftar = mapelPerKelas.get(s.class_id) ?? []
    if (!daftar.includes(nama)) daftar.push(nama)
    mapelPerKelas.set(s.class_id, daftar)
  }

  return {
    kelas,
    kelasAktif,
    kelasLampau,
    sesi,
    sesiAktif,
    attendanceMap,
    subjectNameMap,
    sessionTutorMap,
    mapelPerKelas,
  }
}

/**
 * Sesi terjadwal TERDEKAT milik anak ini, atau null.
 *
 * Beranda cuma perlu satu baris ini, jadi ia tidak memanggil
 * `muatKelasDanSesi()` — kartu paling atas portal tidak perlu menunggu seluruh
 * riwayat sesi, kehadiran, dan nama tutor selesai dibaca.
 */
export async function sesiBerikutnya(studentId: string, sekarangIso: string) {
  const supabase = await createClient()

  const { data: kelasRows } = await supabase
    .from('class_students')
    .select('class_id, is_active, enrolled_at, unenrolled_at')
    .eq('student_id', studentId)
    .eq('is_active', true)

  const kelas = (kelasRows ?? []) as {
    class_id: string
    is_active: boolean
    enrolled_at: string | null
    unenrolled_at: string | null
  }[]
  if (kelas.length === 0) return null

  const { data: sesiRows } = await supabase
    .from('sessions')
    .select('id, class_id, scheduled_at, topic, subject_id, tutor_id')
    .in('class_id', kelas.map((k) => k.class_id))
    .eq('status', 'scheduled')
    .gte('scheduled_at', sekarangIso)
    .order('scheduled_at', { ascending: true })

  const rentangKelas = new Map(kelas.map((k) => [k.class_id, k] as const))
  const sesi = ((sesiRows ?? []) as unknown as (SesiAnak & { class_id: string })[]).find((s) => {
    const rentang = rentangKelas.get(s.class_id)
    return rentang ? coversSession(rentang, s.scheduled_at) : false
  })
  if (!sesi) return null

  const [{ data: mapel }, { data: tutor }, { data: kls }] = await Promise.all([
    sesi.subject_id
      ? supabase.from('subjects').select('name').eq('id', sesi.subject_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sesi.tutor_id
      ? supabase.from('profiles').select('full_name').eq('id', sesi.tutor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('classes').select('name').eq('id', sesi.class_id).maybeSingle(),
  ])

  return {
    scheduled_at: sesi.scheduled_at,
    topik: sesi.topic,
    mapel: (mapel?.name as string | null) ?? null,
    tutor: (tutor?.full_name as string | null) ?? null,
    kelas: (kls?.name as string | null) ?? null,
  }
}

/** Sisa tagihan anak ini, beserta apakah ada yang benar-benar terlambat. */
export interface RingkasanTagihan {
  /** Yang masih harus dibayar — sudah dikurangi pembayaran yang tercatat. */
  sisa: number
  /**
   * Ada tagihan yang lewat jatuh tempo tanpa pembayaran sama sekali, ATAU
   * angsuran yang berhenti lebih dari `MACET_HARI`. Aturannya milik
   * `tagihanTerlambat()`, sama dengan lencana di halaman Tagihan.
   */
  terlambat: boolean
  /**
   * Layak ditampilkan di beranda. Lihat `ringkasanTagihan` — sisa yang belum
   * nol tidak dengan sendirinya berarti ada yang perlu dikerjakan hari ini.
   */
  tampil: boolean
}


/**
 * Sisa tagihan anak ini: yang sudah terbit, belum lunas, belum dibatalkan —
 * DIKURANGI pembayaran yang sudah tercatat.
 *
 * Pengurangan itu dulu tidak ada, dan akibatnya berat sebelah. Invoice kelas
 * reguler diterbitkan satu semester sekaligus, sementara hampir semua orang tua
 * membayarnya bulanan; keluarga yang sudah menyicil empat dari enam bulan tetap
 * membaca angka enam bulan penuh di berandanya, di bawah tulisan "Belum
 * dibayar" berbingkai merah. Angkanya keliru, dan kalimatnya menuduh.
 *
 * `tampil` menjawab pertanyaan yang berbeda dari `sisa`: bukan "masih ada yang
 * belum dibayar" melainkan "ada yang perlu dikerjakan sekarang". Keduanya
 * hampir selalu berbeda di sini. Invoice diterbitkan satu semester sekaligus,
 * jadi sisa yang belum nol adalah keadaan NORMAL selama berbulan-bulan — dan
 * kartu yang berdiri di beranda selama itu bukan pengingat lagi, cuma perabot
 * yang berhenti dibaca.
 *
 * Yang menurunkannya satu hal saja: PEMBAYARAN DI BULAN BERJALAN. Selama bulan
 * ini belum ada setoran, kartunya berdiri; begitu ada satu, ia hilang sampai
 * bulan berikutnya. Itu mengikuti kebiasaan yang sebenarnya — invoicenya
 * semesteran, bayarnya bulanan — tanpa memerlukan jadwal angsuran yang memang
 * tidak ada di basis data.
 *
 * `due_date` sengaja TIDAK dipakai untuk menentukan ini. Ia satu tanggal untuk
 * seluruh semester, jadi ia tidak berulang tiap bulan dan tidak bisa menjawab
 * "apakah setoran bulan ini sudah masuk" — pertanyaan yang justru sedang
 * dijawab kartu ini. Perannya tinggal di `terlambat`, tempat ia memang berarti.
 *
 * `terlambat` ikut karena warna kartunya bergantung padanya. Aturannya sengaja
 * dipinjam dari `lib/tagihan.ts` alih-alih ditulis ulang: yang menyicil ditunggu,
 * yang diam saja dihubungi — dan beranda tidak boleh mengatakan hal yang berbeda
 * dari lencana di halaman Tagihan untuk tagihan yang sama.
 */
export async function ringkasanTagihan(
  studentId: string,
  hariIni: string,
): Promise<RingkasanTagihan> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('id, total_due, status, due_date')
    .eq('student_id', studentId)
    .neq('status', 'draft')

  const belumLunas = ((data ?? []) as {
    id: string
    total_due: number
    status: string
    due_date: string | null
  }[]).filter((i) => i.status !== 'paid' && i.status !== 'cancelled')

  if (belumLunas.length === 0) return { sisa: 0, terlambat: false, tampil: false }

  // Kebijakan "Families read own payments" di migrasi 076 — klien ber-RLS,
  // seperti halaman Tagihan yang membaca tabel yang sama.
  const { data: bayarRows } = await supabase
    .from('invoice_payments')
    .select('invoice_id, amount, paid_at')
    .in('invoice_id', belumLunas.map((i) => i.id))

  const bayar = (bayarRows ?? []) as { invoice_id: string; amount: number; paid_at: string }[]

  const dibayar = new Map<string, number>()
  for (const b of bayar) {
    dibayar.set(b.invoice_id, (dibayar.get(b.invoice_id) ?? 0) + Number(b.amount))
  }

  const terlambat = belumLunas.some((i) =>
    tagihanTerlambat(
      i.status,
      i.due_date,
      hariIni,
      // Angsuran yang berhenti dinilai dari tanggal bayar terakhirnya. Tanpa
      // argumen ini ia tidak akan pernah disebut terlambat — lihat
      // `tagihanTerlambat`.
      tanggalBayarTerakhir(bayar.filter((b) => b.invoice_id === i.id)),
    ),
  )

  // Bulan kalender yang sama, dibandingkan sebagai teks `YYYY-MM`. Cukup untuk
  // maksudnya — "sudah setor bulan ini" — dan tidak menyeret zona waktu.
  const bayarBulanIni = bayar.some((b) => b.paid_at.slice(0, 7) === hariIni.slice(0, 7))

  // `max(0, …)`: pembayaran lebih dari tagihannya bukan hal yang mustahil
  // dicatat, dan kelebihan di satu invoice tidak boleh mengurangi sisa invoice
  // lain — itu akan menyembunyikan tagihan yang benar-benar ada.
  const sisa = belumLunas.reduce(
    (s, i) => s + Math.max(0, Number(i.total_due) - (dibayar.get(i.id) ?? 0)),
    0,
  )

  return {
    sisa,
    terlambat,
    // `sisa > 0` jadi syarat pertama, bukan sekadar bawaan: sebuah invoice bisa
    // sudah tertutup pembayarannya tanpa statusnya sempat diubah jadi `paid`,
    // dan kartu "Belum lunas Rp 0" adalah kekeliruan yang paling terang.
    //
    // `terlambat` TIDAK ikut sebagai syarat kedua meski ia harus selalu
    // terlihat: yang terlambat pasti belum menyetor bulan ini juga. Jarak
    // terjauh antara dua tanggal di bulan yang sama adalah 30 hari, sementara
    // angsuran baru disebut macet di atas 30 — jadi `terlambat` tidak pernah
    // bisa benar bersamaan dengan `bayarBulanIni`, dan menuliskannya cuma akan
    // jadi cabang yang tidak pernah dilewati.
    tampil: sisa > 0 && !bayarBulanIni,
  }
}
