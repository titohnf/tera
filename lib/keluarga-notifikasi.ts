import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { coversSession } from '@/lib/enrollment'
import { tagihanTerlambat } from '@/lib/tagihan'
import { stripClassUniqueTag } from '@/lib/format-class-name'
import { sekarangIso } from '@/lib/waktu'

/**
 * Notifikasi portal keluarga — dirakit dari kejadian yang SUDAH tercatat, bukan
 * dari tabel notifikasi tersendiri.
 *
 * Tidak ada tabel baru dan tidak ada penulis notifikasi di sisi admin. Semua
 * yang perlu dikabarkan sudah punya barisnya sendiri: sesi yang dibatalkan
 * (`sessions.status`), sesi yang baru dijadwalkan (`sessions.created_at`),
 * tagihan yang terbit dan yang mendekati jatuh tempo (`invoices.issued_at`,
 * `due_date`), dan catatan laporan bulanan yang baru ditulis
 * (`monthly_report_notes`). Menyalin kejadian itu ke tabel kedua berarti dua
 * sumber yang bisa berbeda isi, dan yang menemukan perbedaannya adalah orang
 * tua yang menelepon.
 *
 * Semua kuerinya lewat klien ber-RLS, sama seperti sisa portal ini.
 * `lib/notifications.ts` — versi tutor dan admin — memakai `createAdminClient()`
 * dan sengaja TIDAK dipakai ulang di sini: alasannya di `keluargaContext`.
 *
 * Yang TIDAK ada di sini, dan kenapa:
 *
 *   * REschedule sebagai kejadian tersendiri. Riwayatnya ada di
 *     `session_change_requests`, tapi keluarga tidak punya policy baca ke tabel
 *     itu dan tidak semestinya punya: satu barisnya memuat alasan yang ditulis
 *     tutor untuk admin ("saya ada acara keluarga") beserta `admin_note`.
 *     Membuka tabelnya berarti membuka teks itu — RLS-lah batasnya, bukan
 *     kolom mana yang kebetulan di-select halaman ini. Yang terlihat keluarga
 *     adalah hasilnya, dan hasil itu sudah terbaca dari `sessions`: sesi lama
 *     dibatalkan, sesi penggantinya lahir sebagai baris baru.
 *
 *   * Tanda "sudah dibaca" yang tersimpan di server. Keluarga hanya membaca —
 *     tidak ada satu pun policy tulis untuk role `parent` (migrasi 076), dan
 *     menambahkannya demi titik biru tidak sebanding. Titiknya disimpan di
 *     localStorage perangkat masing-masing; lihat `NotifikasiList`.
 */

/** Sejauh apa ke belakang kejadian masih dianggap kabar. */
const HARI_KEBELAKANG = 30

/** Tagihan mulai dikabarkan sekian hari sebelum jatuh tempo. */
const AMBANG_JATUH_TEMPO_HARI = 7

/** Batas atas daftar, supaya bulan yang ramai tidak jadi gulungan tanpa ujung. */
const MAKS = 30

export type JenisNotif =
  | 'sesi-batal'
  | 'sesi-baru'
  | 'tagihan-terbit'
  | 'tagihan-jatuh-tempo'
  | 'laporan'

export type NotifKeluarga = {
  /**
   * Stabil lintas muat ulang — inilah yang ditandai "sudah dibaca" di
   * perangkat. Karena itu ia tidak boleh memuat apa pun yang berubah sendiri
   * (jumlah hari tersisa, status tagihan); kalau berubah, kabar yang sama
   * menyala lagi sebagai baru.
   */
  id: string
  jenis: JenisNotif
  judul: string
  rincian: string | null
  /** Waktu kejadian, ISO. Boleh di masa depan — jatuh tempo memang begitu. */
  waktu: string
  href: string
}

type KelasRow = {
  class_id: string
  is_active: boolean
  enrolled_at: string | null
  unenrolled_at: string | null
  classes: { name: string } | null
}

type SesiRow = {
  id: string
  class_id: string
  scheduled_at: string
  status: string
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

function hariWib(iso: string): string {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * Tanggal `YYYY-MM-DD` sebagai ISO tengah malam WIB.
 *
 * `issued_at` dan `due_date` bertipe date, tanpa jam. Menyandingkannya dengan
 * timestamp sesi apa adanya membuat tagihan hari ini jatuh di pukul 07:00 WIB
 * — sesudah sesi pagi yang sebenarnya lebih dulu terjadi.
 */
function tengahMalamWib(tanggal: string): string {
  return new Date(`${tanggal}T00:00:00+07:00`).toISOString()
}

function tanggalPendek(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jakarta',
  })
}

function jamWib(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

function namaKelasnya(kelas: KelasRow | undefined): string {
  const nama = kelas?.classes?.name
  return nama ? stripClassUniqueTag(nama) : 'Kelas'
}

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function selisihHari(dari: string, ke: string): number {
  return Math.round(
    (Date.parse(`${ke}T00:00:00Z`) - Date.parse(`${dari}T00:00:00Z`)) / 86_400_000,
  )
}

export async function muatNotifikasi(
  studentId: string,
  sekarangIso: string,
): Promise<NotifKeluarga[]> {
  const supabase = await createClient()
  const sejakIso = new Date(Date.parse(sekarangIso) - HARI_KEBELAKANG * 86_400_000).toISOString()
  const hariIni = hariWib(sekarangIso)
  const sejakHari = hariWib(sejakIso)

  const { data: kelasRows } = await supabase
    .from('class_students')
    .select('class_id, is_active, enrolled_at, unenrolled_at, classes(name)')
    .eq('student_id', studentId)
    .eq('is_active', true)

  const kelas = (kelasRows ?? []) as unknown as KelasRow[]
  const classIds = kelas.map((k) => k.class_id)
  const kelasPerId = new Map(kelas.map((k) => [k.class_id, k] as const))

  const kosong = { data: null } as { data: null }
  const [{ data: batalRows }, { data: baruRows }, { data: invoiceRows }, { data: laporanRows }] =
    await Promise.all([
      classIds.length
        ? supabase
            .from('sessions')
            .select('id, class_id, scheduled_at, status, cancellation_reason, created_at, updated_at')
            .in('class_id', classIds)
            .eq('status', 'cancelled')
            .gte('updated_at', sejakIso)
            .order('updated_at', { ascending: false })
        : kosong,
      classIds.length
        ? supabase
            .from('sessions')
            .select('id, class_id, scheduled_at, status, cancellation_reason, created_at, updated_at')
            .in('class_id', classIds)
            .eq('status', 'scheduled')
            .gte('created_at', sejakIso)
            .gte('scheduled_at', sekarangIso)
            .order('scheduled_at', { ascending: true })
        : kosong,
      supabase
        .from('invoices')
        .select('id, invoice_number, total_due, status, due_date, issued_at, classes(name)')
        .eq('student_id', studentId)
        .neq('status', 'draft'),
      supabase
        .from('monthly_report_notes')
        .select('month, mastered, needs_practice, other_notes, created_at, updated_at')
        .eq('student_id', studentId)
        .gte('updated_at', sejakIso),
    ])

  // Sesi di luar masa anak ini ikut kelasnya dibuang — saringan yang sama
  // dengan `muatKelasDanSesi`. Tanpa ia, anak yang baru masuk Agustus dikabari
  // pembatalan sesi Juli kelasnya.
  const milikAnak = (rows: SesiRow[] | null) =>
    (rows ?? []).filter((s) => {
      const rentang = kelasPerId.get(s.class_id)
      return rentang ? coversSession(rentang, s.scheduled_at) : false
    })

  const items: NotifKeluarga[] = []

  for (const s of milikAnak(batalRows as unknown as SesiRow[] | null)) {
    items.push({
      id: `sesi-batal-${s.id}`,
      jenis: 'sesi-batal',
      judul: `Sesi ${tanggalPendek(s.scheduled_at)} dibatalkan`,
      rincian: [
        `${namaKelasnya(kelasPerId.get(s.class_id))} · ${jamWib(s.scheduled_at)} WIB`,
        s.cancellation_reason,
      ]
        .filter(Boolean)
        .join(' — '),
      waktu: s.updated_at,
      href: `/keluarga/${studentId}/jadwal`,
    })
  }

  // Sesi baru dikelompokkan per kelas per hari pembuatan. Jadwal satu semester
  // lahir sekaligus dalam satu penyimpanan: tanpa pengelompokan ini, satu kelas
  // baru mengirim 24 kabar yang isinya sama.
  const kelompokBaru = new Map<string, SesiRow[]>()
  for (const s of milikAnak(baruRows as unknown as SesiRow[] | null)) {
    const kunci = `${s.class_id}|${hariWib(s.created_at)}`
    const daftar = kelompokBaru.get(kunci) ?? []
    daftar.push(s)
    kelompokBaru.set(kunci, daftar)
  }

  for (const [kunci, daftar] of kelompokBaru) {
    const urut = [...daftar].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    const pertama = urut[0]
    const namaKelas = namaKelasnya(kelasPerId.get(pertama.class_id))
    items.push({
      id: `sesi-baru-${kunci}`,
      jenis: 'sesi-baru',
      judul:
        urut.length === 1
          ? `Sesi baru: ${tanggalPendek(pertama.scheduled_at)}`
          : `${urut.length} sesi baru dijadwalkan`,
      rincian:
        urut.length === 1
          ? `${namaKelas} · ${jamWib(pertama.scheduled_at)} WIB`
          : `${namaKelas} · mulai ${tanggalPendek(pertama.scheduled_at)}`,
      waktu: pertama.created_at,
      href: `/keluarga/${studentId}/jadwal`,
    })
  }

  const invoices = (invoiceRows ?? []) as unknown as {
    id: string
    invoice_number: string
    total_due: number
    status: string
    due_date: string | null
    issued_at: string
    classes: { name: string } | null
  }[]

  for (const inv of invoices) {
    const namaKelas = inv.classes?.name ? stripClassUniqueTag(inv.classes.name) : null

    if (inv.issued_at >= sejakHari && inv.status !== 'cancelled') {
      items.push({
        id: `tagihan-terbit-${inv.id}`,
        jenis: 'tagihan-terbit',
        judul: `Tagihan ${inv.invoice_number} terbit`,
        rincian: [namaKelas, rupiah(Number(inv.total_due))].filter(Boolean).join(' · '),
        waktu: tengahMalamWib(inv.issued_at),
        href: `/keluarga/${studentId}/tagihan`,
      })
    }

    // Angsuran sengaja tidak ikut dikabari — alasannya di `tagihanTerlambat`:
    // tanggal jatuh tempo asli bukan lagi ukuran yang adil begitu pembayaran
    // pertama masuk, dan menagihnya lewat lonceng menghukum yang sudah mulai
    // membayar.
    if (!inv.due_date || inv.status === 'paid' || inv.status === 'cancelled') continue
    if (inv.status === 'partially_paid') continue

    const sisaHari = selisihHari(hariIni, inv.due_date)
    if (sisaHari > AMBANG_JATUH_TEMPO_HARI) continue

    const terlambat = tagihanTerlambat(inv.status, inv.due_date, hariIni)
    items.push({
      id: `tagihan-jatuh-tempo-${inv.id}`,
      jenis: 'tagihan-jatuh-tempo',
      judul: terlambat
        ? `Tagihan ${inv.invoice_number} lewat jatuh tempo`
        : `Tagihan ${inv.invoice_number} jatuh tempo ${tanggalPendek(tengahMalamWib(inv.due_date))}`,
      rincian: [namaKelas, rupiah(Number(inv.total_due))].filter(Boolean).join(' · '),
      waktu: tengahMalamWib(inv.due_date),
      href: `/keluarga/${studentId}/tagihan`,
    })
  }

  const laporan = (laporanRows ?? []) as unknown as {
    month: string
    mastered: string | null
    needs_practice: string | null
    other_notes: string | null
    created_at: string
    updated_at: string
  }[]

  for (const l of laporan) {
    // Baris kosong tidak dikabarkan. Admin bisa saja membuka dan menyimpan
    // laporan tanpa menulis apa pun, dan "catatan baru" yang mengantar orang
    // tua ke halaman kosong lebih buruk daripada tidak ada kabar sama sekali.
    if (!l.mastered && !l.needs_practice && !l.other_notes) continue

    const label = new Date(`${l.month}-01T00:00:00Z`).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    items.push({
      id: `laporan-${l.month}`,
      jenis: 'laporan',
      judul: `Catatan laporan ${label} sudah ditulis`,
      rincian: 'Buka laporan bulanan untuk membacanya.',
      waktu: l.updated_at,
      href: `/keluarga/${studentId}/laporan?month=${l.month}`,
    })
  }

  return items.sort((a, b) => b.waktu.localeCompare(a.waktu)).slice(0, MAKS)
}

/**
 * Notifikasi seorang anak untuk SATU permintaan, dirakit paling banyak sekali.
 *
 * Dua pemanggil membutuhkannya dalam permintaan yang sama: layout portal (untuk
 * angka di lonceng, di setiap halaman) dan halaman notifikasi itu sendiri.
 * Tanpa `cache()` keduanya menjalankan empat kueri masing-masing, dan di
 * halaman notifikasi jumlahnya berlipat dua tanpa guna.
 *
 * `sekarang` ikut dikembalikan, bukan dibaca ulang oleh pemanggil: label "3
 * hari lagi" dan penyaring 30 hari harus memakai jam yang sama, dan jam itu
 * hanya boleh dibaca sekali di server (lihat `sekarangIso`).
 */
export const notifikasiAnak = cache(async (studentId: string) => {
  const sekarang = await sekarangIso()
  return { items: await muatNotifikasi(studentId, sekarang), sekarang }
})
