import { createAdminClient } from '@/lib/supabase/server-admin'
import InvoicePageFilters from '@/components/admin/invoices/InvoicePageFilters'
import MetricCard from '@/components/dashboard/MetricCard'
import InvoiceEnrollmentTable from '@/components/admin/invoices/InvoiceEnrollmentTable'
import { coversMonth, coversSession } from '@/lib/enrollment'
import { labelBulan } from '@/lib/waktu'
import { invoiceCoverageMonths } from '@/lib/invoice-line-items'

type EnrollmentRow = {
  student_id: string
  class_id: string
  is_active: boolean
  enrolled_at: string | null
  unenrolled_at: string | null
  profiles: { full_name: string } | null
  classes: { name: string; class_type: string | null; semester: number | null; academic_year: string | null } | null
}

type LineItem = { unit?: string; months?: number; period?: string; is_deduction?: boolean; koreksi_sesi?: boolean }

type InvoiceRow = {
  id: string
  student_id: string
  class_id: string | null
  total_due: number
  issued_at: string
  status: string
  line_items: LineItem[] | null
  payments: { amount: number; paid_at: string }[]
}

/**
 * Selisih antara jumlah pertemuan yang sudah ditagihkan dan yang benar-benar
 * ada di kalender, untuk kelas yang ditagih per pertemuan.
 *
 * Invoice privat dibuat di awal bulan berdasarkan jadwal saat itu. Kalau
 * kemudian ada sesi tambahan, sesi pengganti, atau sesi yang dibatalkan,
 * invoice yang sudah TERKIRIM tidak ikut menyesuaikan — hanya draft yang
 * dikoreksi otomatis oleh syncPrivateClassDraftInvoices(). Selisih itu tidak
 * terlihat di mana pun sampai ada yang mencocokkan satu per satu, jadi
 * ditandai di sini.
 */
type SessionGap = { billed: number; actual: number }

/**
 * Jumlah pertemuan yang DITAGIHKAN di sebuah invoice.
 *
 * Baris potongan pada umumnya tidak ikut dikurangkan meski satuannya
 * "pertemuan". Yang ditemui di data — "Kompensasi Kelas Tidak Terlaksana
 * (Bulan Juni)" dan "Sisa pertemuan bulan sebelumnya" — adalah kompensasi UANG
 * untuk sesi di luar kalender kelas; jumlah pertemuan yang ditagih bulan itu
 * tidak berubah karenanya. Mengurangkannya membuat siswa yang justru sudah
 * diberi kompensasi tampak kurang ditagih.
 *
 * Kecualinya potongan bertanda `koreksi_sesi`: "Kelebihan bayar Agustus"
 * membatalkan satu pertemuan yang terlanjur ditagih di kalender yang sama,
 * pasangan dari "Kekurangan bayar" (+) yang sudah ikut terhitung. Tanpa tanda
 * ini, kelebihan tagih yang sudah dikompensasi terus tampil sebagai selisih.
 * Tandanya dipasang admin di form invoice, bukan ditebak dari keterangannya.
 */
function lineItemQty(items: LineItem[] | null): number {
  return (items ?? [])
    .filter(i => i.unit === 'pertemuan' && (!i.is_deduction || i.koreksi_sesi))
    .reduce((sum, i) => sum + (i.is_deduction ? -1 : 1) * (Number(i.months) || 0), 0)
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// belum_terkirim: no invoice yet, or one exists but is still a draft
// (parent hasn't received anything). menunggu: invoice was sent but
// nothing paid yet — distinct from belum_terkirim so admins can tell
// "haven't billed them" apart from "billed, waiting on payment".
//
// Driven entirely by the most recent invoice's own status (set
// authoritatively by recordPayment/deletePayment) rather than comparing
// against an older invoice's total — a class can now have several
// genuinely independent invoices (e.g. one per month), so an older
// invoice's total is no longer a meaningful "canonical class price".
function computeStatus(invoices: InvoiceRow[]): 'lunas' | 'angsuran' | 'menunggu' | 'belum_terkirim' {
  if (invoices.length === 0) return 'belum_terkirim'
  const latestInv = invoices[0]
  if (latestInv.status === 'draft') return 'belum_terkirim'
  if (latestInv.status === 'paid') return 'lunas'
  if (latestInv.status === 'partially_paid') return 'angsuran'
  return 'menunggu'
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; semester?: string; tahunAjaran?: string; bulan?: string }>
}) {
  const {
    q = '',
    status: statusFilter = '',
    semester: semesterFilter = '',
    tahunAjaran: tahunAjaranFilter = '',
    bulan: bulanFilter = '',
  } = await searchParams
  const admin = createAdminClient()

  const [enrollmentsRes, invoicesRes] = await Promise.all([
    admin
      .from('class_students')
      // Keanggotaan yang sudah berakhir ikut diambil, lalu disaring di bawah:
      // uang yang sudah diterima dan tunggakan yang ditinggalkan tidak boleh
      // hilang dari halaman ini hanya karena siswanya berhenti.
      .select('student_id, class_id, is_active, enrolled_at, unenrolled_at, profiles!student_id(full_name), classes!class_id(name, class_type, semester, academic_year)')
      .order('profiles(full_name)') as unknown as Promise<{ data: EnrollmentRow[] | null }>,
    admin
      .from('invoices')
      .select('id, student_id, class_id, total_due, issued_at, status, line_items, invoice_payments(amount, paid_at)')
      .not('student_id', 'is', null)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: (InvoiceRow & { invoice_payments: { amount: number; paid_at: string }[] })[] | null }>,
  ])

  // Sesi dipakai untuk dua hal: mencocokkan jumlah pertemuan tertagih di kelas
  // privat, dan mengisi kolom "Sesi" — berapa pertemuan yang benar-benar
  // berlangsung di bulan yang sedang dilihat. Karena itu semua jenis kelas
  // ikut diambil, bukan hanya yang ditagih per pertemuan.
  const relevantClassIds = [...new Set(
    (enrollmentsRes.data ?? [])
      .filter(e => e.classes?.class_type !== 'yayasan')
      .map(e => e.class_id),
  )]
  const { data: sessionRows } = relevantClassIds.length > 0
    ? await admin
        .from('sessions')
        .select('class_id, scheduled_at, status')
        .in('class_id', relevantClassIds)
        .neq('status', 'cancelled')
        .limit(5000) as unknown as { data: { class_id: string; scheduled_at: string; status: string }[] | null }
    : { data: [] }

  const sessionsByClass = new Map<string, string[]>()
  for (const row of sessionRows ?? []) {
    const arr = sessionsByClass.get(row.class_id) ?? []
    arr.push(row.scheduled_at)
    sessionsByClass.set(row.class_id, arr)
  }

  // Yayasan classes never get invoiced (see generateInvoice's rejection in
  // lib/actions/admin/invoices.ts) — keep their students off this list too.
  const enrollments = (enrollmentsRes.data ?? []).filter(e => e.classes?.class_type !== 'yayasan')

  // Normalize invoices: attach payments
  const invoices: InvoiceRow[] = (invoicesRes.data ?? []).map(inv => ({
    ...inv,
    class_id: inv.class_id,
    payments: inv.invoice_payments ?? [],
  }))

  // Group invoices by student+class
  const invoiceMap = new Map<string, InvoiceRow[]>()
  for (const inv of invoices) {
    const key = `${inv.student_id}__${inv.class_id ?? ''}`
    if (!invoiceMap.has(key)) invoiceMap.set(key, [])
    invoiceMap.get(key)!.push(inv)
  }

  // Build rows
  type Row = {
    studentId: string
    studentName: string
    classId: string
    className: string
    classPrice: number
    kekurangan: number
    totalPaid: number
    status: 'lunas' | 'angsuran' | 'menunggu' | 'belum_terkirim'
    invoiceId: string | null
    bulanLabel: string
    hasExisting: boolean
    semester: number | null
    academicYear: string | null
    lastPaymentMonth: string | null
    /** Keanggotaan kelasnya sudah berakhir — barisnya riwayat, bukan tagihan berjalan. */
    isFormer: boolean
    sessionGap: SessionGap | null
    /** Pertemuan di kalender pada bulan yang sedang dipilih (semua bulan bila tidak difilter). */
    sessionCount: number
  }

  // Mantan siswa hanya ikut kalau ia memang punya invoice. Tanpa syarat itu,
  // setiap siswa yang pernah terdaftar akan kembali memenuhi daftar penagihan
  // meski tidak ada apa pun yang perlu ditagih atau dicatat untuknya.
  const relevantEnrollments = enrollments.filter(e =>
    e.is_active || (invoiceMap.get(`${e.student_id}__${e.class_id}`)?.length ?? 0) > 0
  )

  /**
   * Membandingkan pertemuan tertagih dengan sesi di kalender.
   *
   * Hanya sampai bulan terakhir yang sudah ditagihkan — sesi bulan-bulan
   * berikutnya memang belum waktunya ditagih, dan ikut menghitungnya akan
   * menandai semua siswa sebagai "kurang tagih" sepanjang semester.
   *
   * Invoice draft dikecualikan dari kedua sisi: isinya dikoreksi otomatis
   * mengikuti jadwal, jadi tidak pernah benar-benar melenceng.
   *
   * Saat filter bulan aktif, kedua sisi dipersempit ke bulan itu saja —
   * `invs` sudah berisi invoice bulan tersebut, sesinya ikut dibatasi.
   */
  function computeSessionGap(e: EnrollmentRow, invs: InvoiceRow[]): SessionGap | null {
    if (e.classes?.class_type !== 'private') return null
    const issued = invs.filter(inv => inv.status !== 'draft')
    if (issued.length === 0) return null

    const lastBilledMonth = issued.reduce(
      (latest, inv) => (inv.issued_at.slice(0, 7) > latest ? inv.issued_at.slice(0, 7) : latest),
      '',
    )
    const billed = issued.reduce((sum, inv) => sum + lineItemQty(inv.line_items), 0)
    const actual = (sessionsByClass.get(e.class_id) ?? []).filter(at =>
      (bulanFilter ? at.slice(0, 7) === bulanFilter : at.slice(0, 7) <= lastBilledMonth) &&
      coversSession(e, at),
    ).length

    return billed === actual ? null : { billed, actual }
  }

  // Baris yang ikut saat filter bulan aktif: yang punya invoice bulan itu, plus
  // keanggotaan yang masih berjalan dan memang mencakup bulan itu — supaya yang
  // BELUM ditagih bulan ini tetap kelihatan, bukan hanya yang sudah.
  const monthEnrollments = bulanFilter
    ? relevantEnrollments.filter(e => {
        const invs = invoiceMap.get(`${e.student_id}__${e.class_id}`) ?? []
        if (invs.some(inv => invoiceCoverageMonths(inv).includes(bulanFilter))) return true
        return e.is_active && coversMonth(e, bulanFilter)
      })
    : relevantEnrollments

  const allRows: Row[] = monthEnrollments.map(e => {
    const key = `${e.student_id}__${e.class_id}`
    const semuaInvs = invoiceMap.get(key) ?? []

    // Uang dan status menjawab dua pertanyaan berbeda, jadi keduanya menyaring
    // invoice dengan cara berbeda pula:
    //
    // Uang — "berapa yang ditagihkan BULAN INI" — memakai bulan terbit. Nilai
    // sebuah paket semester adalah uang bulan ia diterbitkan; membiarkannya
    // muncul lagi di lima bulan berikutnya akan menghitung uang yang sama
    // berkali-kali di kartu Total Invoice.
    //
    // Status — "tagihan Agustusnya sudah dikirim atau belum" — memakai bulan
    // yang DICAKUP. Invoice grup terbit sekali untuk satu semester, jadi
    // menilainya dari bulan terbit membuat siswa yang sudah ditagih terbaca
    // "Belum Dikirim" sepanjang sisa semester.
    //
    // Akibatnya sebuah baris bisa berstatus "Angsuran" dengan Nilai Invoice
    // "—": tagihannya memang mencakup bulan ini, tapi uangnya tercatat di
    // bulan invoice itu terbit.
    const invs = bulanFilter
      ? semuaInvs.filter(inv => inv.issued_at.slice(0, 7) === bulanFilter)
      : semuaInvs
    const statusInvs = bulanFilter
      ? semuaInvs.filter(inv => invoiceCoverageMonths(inv).includes(bulanFilter))
      : semuaInvs
    // Total Invoice / Dibayar / Belum Dibayar must stay internally
    // consistent (Total Invoice − Belum Dibayar = Dibayar), so all three
    // are derived from the SAME set of invoices (every non-cancelled
    // invoice for this student+class, not just the latest) — otherwise
    // deleting a payment on an older invoice moves "Dibayar" without
    // moving "Belum Dibayar", which looks like the totals are out of sync.
    const billedInvs = invs.filter(inv => inv.status !== 'cancelled')
    const classPrice = billedInvs.reduce((sum, inv) => sum + inv.total_due, 0)
    const totalPaid = billedInvs.reduce((sum, inv) => sum + inv.payments.reduce((s, p) => s + p.amount, 0), 0)
    const kekurangan = Math.max(0, classPrice - totalPaid)
    const activeInv = statusInvs.find(inv => inv.status === 'sent' || inv.status === 'partially_paid')

    // Month of the most recent payment actually recorded, for the
    // "Angsuran {bulan}" label — ground truth from paid_at, not a
    // theoretical mapping onto the per-month breakdown. Dibaca dari invoice
    // yang sama dengan yang menentukan lencananya, supaya label dan status
    // tidak bercerita tentang tagihan yang berbeda.
    const allRowPayments = statusInvs.flatMap(inv => inv.payments)
    const lastPayment = allRowPayments.length > 0
      ? allRowPayments.reduce((latest, p) => new Date(p.paid_at) > new Date(latest.paid_at) ? p : latest)
      : null
    const lastPaymentMonth = lastPayment
      ? new Date(lastPayment.paid_at).toLocaleDateString('id-ID', { month: 'long' })
      : null

    return {
      studentId: e.student_id,
      studentName: e.profiles?.full_name ?? '—',
      classId: e.class_id,
      className: e.classes?.name ?? '—',
      classPrice,
      kekurangan,
      totalPaid,
      status: computeStatus(statusInvs),
      invoiceId: activeInv?.id ?? null,
      bulanLabel: activeInv ? new Date(activeInv.issued_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '',
      hasExisting: invs.length > 0,
      semester: e.classes?.semester ?? null,
      academicYear: e.classes?.academic_year ?? null,
      lastPaymentMonth,
      isFormer: !e.is_active,
      sessionGap: computeSessionGap(e, billedInvs),
      sessionCount: (sessionsByClass.get(e.class_id) ?? []).filter(at =>
        (!bulanFilter || at.slice(0, 7) === bulanFilter) && coversSession(e, at),
      ).length,
    }
  })

  // Pilihan filter diambil dari seluruh keanggotaan, bukan dari baris yang
  // sudah disaring bulan — kalau tidak, memilih satu bulan ikut mengosongkan
  // isi dropdown semester dan tahun ajaran.
  const semesterOptions = [...new Set(
    relevantEnrollments.map(e => e.classes?.semester).filter((s): s is number => s !== null && s !== undefined),
  )].sort((a, b) => a - b)
  const tahunAjaranOptions = [...new Set(
    relevantEnrollments.map(e => e.classes?.academic_year).filter((y): y is string => !!y),
  )].sort()

  // Pilihan bulan datang dari dua sumber: bulan terbit invoice, dan bulan yang
  // punya sesi di kalender. Sumber kedua penting supaya bulan yang sesinya
  // sudah berjalan tapi belum ditagih sama sekali tetap bisa dibuka.
  const bulanOptions = [...new Set([
    ...invoices.map(inv => inv.issued_at.slice(0, 7)),
    ...(sessionRows ?? []).map(row => row.scheduled_at.slice(0, 7)),
  ])]
    .sort()
    .reverse()
    .map(value => ({ value, label: labelBulan(value) }))

  // Filters
  let rows = allRows
  if (q) {
    const lq = q.toLowerCase()
    rows = rows.filter(r => r.studentName.toLowerCase().includes(lq) || r.className.toLowerCase().includes(lq))
  }
  if (statusFilter) {
    rows = rows.filter(r => r.status === statusFilter)
  }
  if (semesterFilter) {
    rows = rows.filter(r => String(r.semester ?? '') === semesterFilter)
  }
  if (tahunAjaranFilter) {
    rows = rows.filter(r => r.academicYear === tahunAjaranFilter)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Invoice
          {bulanFilter && (
            <span className="ml-2 text-base font-normal text-gray-400">{labelBulan(bulanFilter)}</span>
          )}
        </h1>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {(() => {
          const invoicedRows = allRows.filter(r => r.hasExisting)
          const totalInvoice = invoicedRows.reduce((sum, r) => sum + r.classPrice, 0)
          const totalKekurangan = invoicedRows.reduce((sum, r) => sum + r.kekurangan, 0)
          const totalDibayar = invoicedRows.reduce((sum, r) => sum + r.totalPaid, 0)
          const belumLunasCount = invoicedRows.filter(r => r.kekurangan > 0).length
          // Angka ini pernah berselisih dengan Laba Rugi justru karena mantan
          // siswa tidak ikut. Sekarang ikut, dan jumlahnya disebutkan supaya
          // selisih dengan daftar siswa aktif bisa langsung dijelaskan.
          const formerRows = invoicedRows.filter(r => r.isFormer)
          const formerNote = formerRows.length > 0
            ? `termasuk ${formerRows.length} mantan siswa`
            : undefined
          const formerUnpaid = formerRows.filter(r => r.kekurangan > 0).length
          return (
            <>
              <MetricCard label="Total Invoice" value={formatRupiah(totalInvoice)} sub={`${invoicedRows.length} siswa`} />
              <MetricCard label="Dibayar" value={formatRupiah(totalDibayar)} valueColor="text-green-600" sub={formerNote} />
              <MetricCard
                label="Belum Dibayar"
                value={formatRupiah(totalKekurangan)}
                valueColor="text-red-600"
                sub={formerUnpaid > 0 ? `${belumLunasCount} siswa · ${formerUnpaid} sudah berhenti` : `${belumLunasCount} siswa`}
              />
            </>
          )
        })()}
      </div>

      {(() => {
        const gapRows = allRows.filter(r => r.sessionGap)
        if (gapRows.length === 0) return null
        return (
          <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-orange-700">
              {gapRows.length === 1 ? '1 siswa' : `${gapRows.length} siswa`} punya jumlah pertemuan di
              kalender yang tidak sama dengan yang sudah ditagihkan. Invoice yang sudah terkirim tidak
              ikut menyesuaikan sendiri saat ada sesi tambahan atau pembatalan, jadi perlu dicek ulang.
            </p>
          </div>
        )
      })()}

      {/* Search + filter */}
      <InvoicePageFilters
        q={q}
        statusFilter={statusFilter}
        semesterFilter={semesterFilter}
        tahunAjaranFilter={tahunAjaranFilter}
        bulanFilter={bulanFilter}
        semesterOptions={semesterOptions}
        tahunAjaranOptions={tahunAjaranOptions}
        bulanOptions={bulanOptions}
      />

      {/* Table */}
      <InvoiceEnrollmentTable rows={rows} bulanLabel={bulanFilter ? labelBulan(bulanFilter) : null} />
    </div>
  )
}
