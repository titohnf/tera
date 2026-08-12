import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MonthSelect from '@/components/admin/attendance/MonthSelect'
import MetricCard from '@/components/dashboard/MetricCard'
import ExpenseManager from '@/components/admin/finance/ExpenseManager'
import { buildProjection } from '@/lib/finance/prediksi'
import {
  getMonthlyTotals,
  getPeriodTotals,
  getPeriodBreakdown,
  getActivityMonths,
  parseFinancePeriod,
  parseTrendGrouping,
  buildTrendRows,
  semesterMonths,
  semesterOf,
  financePeriodValue,
  financePeriodLabel,
  currentMonthWib,
  formatMonthLabel,
  recentMonths,
  expenseCategoryLabel,
  ALL_TIME,
} from '@/lib/finance/laba-rugi'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tren?: string; proyeksi?: string }>
}) {
  const { month: rawMonth, tren: rawTren, proyeksi: rawProyeksi } = await searchParams
  const period = parseFinancePeriod(rawMonth)
  const isAllTime = period.kind === 'all'
  const month = period.kind === 'month' ? period.month : currentMonthWib()
  const monthLabel = financePeriodLabel(period)

  const admin = createAdminClient()

  const grouping = parseTrendGrouping(rawTren)
  const showProjection = rawProyeksi === '1'

  // Bulan yang punya catatan — dipakai baris semester dan label rentang di
  // kartu laba bersih.
  const activityMonths = isAllTime ? await getActivityMonths(admin) : []

  // Tampilan Bulan memuat semester yang sedang berjalan — Juli–Desember untuk
  // SM 1, Januari–Juni untuk SM 2 — bukan enam bulan terakhir yang menyeberang
  // pergantian semester. Dengan begitu ia jadi rincian dari baris semester di
  // tampilan sebelahnya, bukan potongan lain yang kebetulan juga enam bulan.
  //
  // Bulan yang belum ada transaksinya tetap ditampilkan sebagai nol: bulan
  // kosong justru informasi — yang belum ada pemasukannya, yang biayanya belum
  // dicatat, atau yang memang belum datang. Tampilan Semester tetap mengikuti
  // umur data, karena tujuannya merangkum riwayat.
  //
  // Di mode per bulan tabel ini tidak tampil; yang dibutuhkan hanya bulan
  // sebelumnya untuk pembanding di kartu laba bersih.
  const semesterSekarang = semesterOf(currentMonthWib())
  // Proyeksi selalu bicara tentang satu semester berjalan, jadi barisnya
  // mengikuti bulan semester itu apa pun pengelompokan yang dipilih.
  const trendMonths = !isAllTime
    ? recentMonths(month, 2)
    : grouping === 'bulan' || showProjection
      ? semesterMonths(currentMonthWib())
      : activityMonths
  const [current, breakdown, totals] = await Promise.all([
    getPeriodTotals(admin, period),
    getPeriodBreakdown(admin, period),
    trendMonths.length > 0 ? getMonthlyTotals(admin, trendMonths) : Promise.resolve([]),
  ])

  // Pembanding hanya berarti untuk satu bulan — "Semua Waktu" tidak punya
  // periode sebelumnya.
  const previous = isAllTime ? undefined : totals[1]
  const projected = isAllTime && showProjection
    ? await buildProjection(admin, trendMonths, totals)
    : null
  const trendRows = buildTrendRows(projected ?? totals, grouping)
  const trendTotal = trendRows.reduce(
    (acc, r) => ({
      cashIn: acc.cashIn + r.cashIn,
      payroll: acc.payroll + r.payroll,
      operational: acc.operational + r.operational,
      netProfit: acc.netProfit + r.netProfit,
    }),
    { cashIn: 0, payroll: 0, operational: 0, netProfit: 0 },
  )

  // "Semua Waktu" tidak memberi tahu apa-apa soal seberapa panjang riwayatnya,
  // jadi kartu laba bersih menyebut rentang bulan yang benar-benar berisi data
  // — bukan jendela tabel tren, yang bisa memuat bulan kosong.
  // activityMonths sudah terurut dari yang terbaru.
  const rentangLabel = isAllTime && activityMonths.length > 0
    ? (activityMonths.length === 1
        ? formatMonthLabel(activityMonths[0])
        : `${formatMonthLabel(activityMonths[activityMonths.length - 1])} – ${formatMonthLabel(activityMonths[0])}`)
    : monthLabel

  const monthOptions = [
    { value: ALL_TIME, label: 'Semua Waktu' },
    ...recentMonths(currentMonthWib(), 12).map(m => ({ value: m, label: formatMonthLabel(m) })),
  ]
  // Bulan yang dipilih lewat URL bisa lebih tua dari 12 bulan terakhir.
  if (!monthOptions.some(o => o.value === financePeriodValue(period))) {
    monthOptions.splice(1, 0, { value: month, label: formatMonthLabel(month) })
  }

  const profitDiff = previous ? current.netProfit - previous.netProfit : null

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Laba Rugi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Uang masuk dan keluar, dihitung dari kas yang benar-benar berpindah.
          </p>
        </div>
        <MonthSelect options={monthOptions} value={financePeriodValue(period)} />
      </div>

      {/* Ringkasan — satu baris, laba bersih paling kiri */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <MetricCard
          label="Laba Bersih"
          value={formatRupiah(current.netProfit)}
          valueColor={current.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}
          sub={
            <>
              {/* span, bukan p: MetricCard sudah membungkus sub dengan <p>. */}
              <span className="block">{rentangLabel}</span>
              {previous && profitDiff !== null && (
                <span className="block mt-0.5">
                  <span className={profitDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {profitDiff >= 0 ? 'Naik' : 'Turun'} {formatRupiah(Math.abs(profitDiff))}
                  </span>
                  {` dari ${formatMonthLabel(previous.month)}`}
                </span>
              )}
            </>
          }
        />
        <MetricCard
          label="Pemasukan"
          value={formatRupiah(current.cashIn)}
          valueColor="text-green-600"
          sub={`${breakdown.income.length} siswa membayar`}
        />
        <MetricCard
          label="Gaji Tutor"
          value={formatRupiah(current.payroll)}
          valueColor={current.payroll > 0 ? 'text-red-500' : undefined}
          sub={
            current.payrollUnpaid > 0
              ? `${formatRupiah(current.payrollUnpaid)} belum ditandai lunas`
              : `${breakdown.payroll.reduce((s, p) => s + p.slips, 0)} slip gaji`
          }
        />
        <MetricCard
          label="Biaya Operasional"
          value={formatRupiah(current.operational)}
          valueColor={current.operational > 0 ? 'text-orange-500' : undefined}
          sub={
            breakdown.expensesByCategory.length > 0
              ? breakdown.expensesByCategory
                  .slice(0, 2)
                  .map(c => expenseCategoryLabel(c.category))
                  .join(', ') + (breakdown.expensesByCategory.length > 2 ? ', ...' : '')
              : 'Belum ada yang dicatat'
          }
        />
      </div>

      {/* Tren — hanya berguna saat melihat seluruh riwayat; di mode per bulan,
          angkanya sudah ada di kartu-kartu di atas. */}
      {isAllTime && (
      <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {grouping === 'semester'
            ? `Tren per Semester (${trendRows.length} semester)`
            : `Tren per Bulan · ${semesterSekarang.label}`}
          {showProjection && (
            <span className="ml-2 text-xs font-normal text-blue-600">
              simulasi ideal {semesterSekarang.label}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5">
          {([['semester', 'Semester'], ['bulan', 'Bulan']] as const).map(([value, label]) => (
            <Link
              key={value}
              href={`/admin/finance?month=${financePeriodValue(period)}&tren=${value}${showProjection ? '&proyeksi=1' : ''}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                grouping === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="w-px h-4 bg-gray-200 mx-1" />
          <Link
            href={`/admin/finance?month=${financePeriodValue(period)}&tren=${grouping}${showProjection ? '' : '&proyeksi=1'}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showProjection
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`w-6 h-3 rounded-full flex items-center transition-colors ${
              showProjection ? 'bg-blue-400/60 justify-end' : 'bg-gray-200 justify-start'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-white m-0.5" />
            </span>
            Proyeksi
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-x-auto mb-8">
        <table className="w-full text-sm min-w-[36rem]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                {grouping === 'semester' ? 'Semester' : 'Bulan'}
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-green-600">Pemasukan</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-red-500">Gaji Tutor</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-orange-500">Operasional</th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-600">Laba Bersih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trendRows.map(t => (
              <tr key={t.key} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">
                  {/* Baris semester tidak bisa dibuka: filter halaman ini hanya
                      mengenal satu bulan atau seluruh riwayat. */}
                  {t.linkMonth ? (
                    <Link href={`/admin/finance?month=${t.linkMonth}`} className="hover:underline">
                      {t.label}
                    </Link>
                  ) : (
                    t.label
                  )}
                </td>
                <td className="text-right px-4 py-2.5 text-gray-600">{formatRupiah(t.cashIn)}</td>
                <td className="text-right px-4 py-2.5 text-gray-600">{formatRupiah(t.payroll)}</td>
                <td className="text-right px-4 py-2.5 text-gray-600">{formatRupiah(t.operational)}</td>
                <td className={`text-right px-5 py-2.5 font-semibold ${
                  t.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}>
                  {formatRupiah(t.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-100 bg-gray-50">
            <tr>
              <td className="px-5 py-2.5 text-xs font-semibold text-gray-600">
                {showProjection ? `Proyeksi ${semesterSekarang.label}` : 'Total'}
              </td>
              <td className="text-right px-4 py-2.5 text-sm font-semibold text-gray-800">{formatRupiah(trendTotal.cashIn)}</td>
              <td className="text-right px-4 py-2.5 text-sm font-semibold text-gray-800">{formatRupiah(trendTotal.payroll)}</td>
              <td className="text-right px-4 py-2.5 text-sm font-semibold text-gray-800">{formatRupiah(trendTotal.operational)}</td>
              <td className={`text-right px-5 py-2.5 text-sm font-bold ${
                trendTotal.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'
              }`}>
                {formatRupiah(trendTotal.netProfit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {showProjection && (
        <p className="-mt-6 mb-8 text-xs text-gray-400 leading-relaxed">
          Simulasi keadaan ideal: semua siswa lanjut sampai akhir semester, membayar tepat di bulan
          tagihannya tanpa menunggak, dan gaji tutor dibayar di bulan yang sama dengan sesinya.
          Pemasukan dihitung dari tarif bimbel × sesi terjadwal (privat) atau × siswa aktif (grup),
          gaji tutor dari sesi terjadwal × tarif per sesi dengan asumsi semua siswa hadir. Karena
          itu <strong>bulan yang sudah lewat pun ikut disimulasikan</strong> dan angkanya bisa
          berbeda dari kas yang sebenarnya diterima. Siswa dan kelas baru belum diperhitungkan.
        </p>
      )}
      </>
      )}

      {/* Pemasukan per siswa */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Pemasukan {monthLabel}</h2>
      {breakdown.income.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-8 text-center text-sm text-gray-500 mb-8">
          {isAllTime ? 'Belum ada pembayaran yang tercatat.' : 'Belum ada pembayaran masuk bulan ini.'}
          <div className="mt-2">
            <Link href="/admin/invoices" className="text-xs text-blue-600 hover:underline">
              Lihat invoice →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Siswa</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Dibayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {breakdown.income.map(i => (
                <tr key={i.studentName} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 text-gray-800">{i.studentName}</td>
                  <td className="text-right px-5 py-2.5 font-medium text-gray-800">{formatRupiah(i.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-100 bg-gray-50">
              <tr>
                <td className="px-5 py-2.5 text-xs font-semibold text-gray-600">Total</td>
                <td className="text-right px-5 py-2.5 text-sm font-semibold text-gray-800">
                  {formatRupiah(current.cashIn)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Gaji tutor */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Gaji Tutor {monthLabel}</h2>
      {breakdown.payroll.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-8 text-center text-sm text-gray-500 mb-8">
          {isAllTime
            ? 'Belum ada slip gaji yang sudah dikirim atau dibayar.'
            : 'Belum ada slip gaji yang jatuh tempo dibayar bulan ini.'}
          <div className="mt-2">
            <Link href="/admin/payslips" className="text-xs text-blue-600 hover:underline">
              Buat slip gaji →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Tutor</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Sesi</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {breakdown.payroll.map(p => (
                <tr key={p.tutorName} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-medium text-gray-800">
                    {p.tutorName}
                    {p.slips > 1 && (
                      <span className="ml-2 text-xs font-normal text-gray-400">{p.slips} slip</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-2.5 text-gray-600">{p.sessions}</td>
                  <td className="text-center px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {p.status === 'paid' ? 'Lunas' : 'Belum dibayar'}
                    </span>
                  </td>
                  <td className="text-right px-5 py-2.5 font-medium text-gray-800">{formatRupiah(p.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-100 bg-gray-50">
              <tr>
                <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-gray-600">Total</td>
                <td className="text-right px-5 py-2.5 text-sm font-semibold text-gray-800">
                  {formatRupiah(current.payroll)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Biaya operasional — satu-satunya bagian yang diinput di halaman ini */}
      <div className="mb-8">
        {/* Di mode Semua Waktu daftarnya lintas bulan dan tidak bisa disunting
            di sini, jadi yang berguna adalah totalnya per kategori — bukan
            baris demi baris sepanjang riwayat. */}
        {isAllTime ? (
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Biaya Operasional</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total seluruh riwayat per kategori. Pilih satu bulan untuk menambah atau mengubah.
              </p>
            </div>
            {breakdown.expensesByCategory.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                Belum ada biaya operasional tercatat sama sekali.
                <br />
                <span className="text-xs text-gray-400">
                  Tanpa ini, laba yang tampil masih terhitung terlalu besar.
                </span>
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Kategori</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdown.expensesByCategory.map(c => (
                    <tr key={c.category} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-800">{expenseCategoryLabel(c.category)}</td>
                      <td className="text-right px-5 py-2.5 font-medium text-gray-800">{formatRupiah(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-100 bg-gray-50">
                  <tr>
                    <td className="px-5 py-2.5 text-xs font-semibold text-gray-600">Total</td>
                    <td className="text-right px-5 py-2.5 text-sm font-semibold text-gray-800">
                      {formatRupiah(current.operational)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        ) : (
          <ExpenseManager
            month={month}
            expenses={breakdown.expenses}
            total={current.operational}
          />
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 leading-relaxed">
        Pemasukan dihitung dari pembayaran invoice yang tercatat di periode ini — termasuk cicilan
        dan pelunasan tunggakan bulan sebelumnya. Gaji tutor dihitung dari slip gaji yang tanggal
        gajiannya jatuh di periode ini, bukan bulan kerjanya, dan hanya slip yang sudah dikirim
        atau dibayar — slip draft belum dihitung.
      </p>
    </div>
  )
}
