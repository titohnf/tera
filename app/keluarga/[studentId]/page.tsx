import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect, bulanIni } from '@/lib/keluarga'
import { hitungKehadiran } from '@/lib/kehadiran'
import { coversSession } from '@/lib/enrollment'
import { sekarangIso } from '@/lib/waktu'
import SiswaHeaderCard from '@/components/siswa/SiswaHeaderCard'
import SiswaTabs from '@/components/siswa/SiswaTabs'
import SiswaSidebar from '@/components/siswa/SiswaSidebar'
import RiwayatKelas from '@/components/siswa/RiwayatKelas'
import JadwalTable from '@/components/siswa/JadwalTable'

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const statusTagihan: Record<string, { teks: string; kelas: string }> = {
  paid: { teks: 'Lunas', kelas: 'bg-green-100 text-green-700' },
  sent: { teks: 'Belum dibayar', kelas: 'bg-yellow-100 text-yellow-700' },
  overdue: { teks: 'Terlambat', kelas: 'bg-red-100 text-red-600' },
  cancelled: { teks: 'Dibatalkan', kelas: 'bg-gray-100 text-gray-500' },
}

/**
 * Beranda anak di portal keluarga — bentuknya sama dengan halaman detail siswa
 * milik admin: kartu identitas, bilah tab, lalu kolom ringkasan di kanan.
 *
 * Sebelumnya halaman ini punya wajahnya sendiri: dua kartu daftar dan sepetak
 * menu. Isinya memang berangkat dari data yang sama, tapi orang tua dan admin
 * yang saling menelepon sambil melihat layar berbeda harus lebih dulu sepakat
 * mereka sedang melihat hal yang sama — dan itu jauh lebih mudah kalau
 * halamannya memang terlihat sama.
 *
 * Tab "Catatan" milik admin tidak ada di sini. Catatan performa tutor sampai ke
 * orang tua di dalam Laporan Bulanan, tempat catatan itu dirakit; menaruhnya
 * dua kali cuma mengulang isi yang sama.
 *
 * Yang tetap milik admin: tombol Edit, Aksi (buat tagihan, jadwalkan sesi,
 * nonaktifkan, hapus), status kritis, dan blok Akun berisi UUID. Semuanya alat
 * kerja, bukan informasi tentang anaknya.
 */
export default async function AnakBeranda({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { studentId } = await params
  const { tab } = await searchParams
  const { anak } = await anakOrRedirect(studentId)
  const supabase = await createClient()

  const waktuSekarang = await sekarangIso()

  const aktif = tab === 'tagihan' || tab === 'laporan' ? tab : 'jadwal'

  const { data: profil } = await supabase
    .from('profiles')
    .select('full_name, nickname, grade, level, birth_date, email, phone, parent_name, parent_phone, created_at, is_active, avatar_url')
    .eq('id', studentId)
    .maybeSingle()

  const { data: kelasRows } = await supabase
    .from('class_students')
    .select('class_id, is_active, enrolled_at, unenrolled_at, classes(name, schedule_days, schedule_time)')
    .eq('student_id', studentId)

  const kelas = (kelasRows ?? []) as unknown as {
    class_id: string
    is_active: boolean
    enrolled_at: string | null
    unenrolled_at: string | null
    classes: { name: string; schedule_days: number[] | null; schedule_time: string | null } | null
  }[]
  const classIds = kelas.map((k) => k.class_id)

  const { data: sesiRows } = classIds.length
    ? await supabase
        .from('sessions')
        .select('id, class_id, scheduled_at, topic, status, cancellation_reason, subject_id, tutor_id')
        .in('class_id', classIds)
        .order('scheduled_at', { ascending: false })
    : { data: null }
  const semuaSesi = (sesiRows ?? []) as unknown as {
    id: string
    class_id: string
    scheduled_at: string
    topic: string | null
    status: string
    subject_id: string | null
    tutor_id: string | null
  }[]

  // Sesi di luar masa anak ini ikut kelasnya dibuang — aturan yang sama dengan
  // halaman detail siswa admin (`inWindow` di sana). Kelas hidup lebih lama
  // daripada keanggotaan muridnya: anak yang baru masuk Agustus tidak punya
  // urusan dengan sesi Juli kelasnya, dan menampilkannya di sini membuat jumlah
  // sesi serta persentase kehadiran berbeda dengan yang dilihat admin.
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

  const { data: tutorRows } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', [...new Set(sesi.map((s) => s.tutor_id).filter(Boolean))] as string[])
  const namaTutor = new Map((tutorRows ?? []).map((t) => [t.id as string, t.full_name as string]))
  const sessionTutorMap: Record<string, string> = {}
  for (const s of sesi) if (s.tutor_id) sessionTutorMap[s.id] = namaTutor.get(s.tutor_id) ?? ''

  // Invoice draft belum diterbitkan ke keluarga — angkanya masih bisa berubah.
  const { data: invoiceRows } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_due, status, due_date, issued_at')
    .eq('student_id', studentId)
    .neq('status', 'draft')
    .order('issued_at', { ascending: false })
  const invoices = invoiceRows ?? []

  // Jendela enam bulan yang SAMA dengan halaman laporan. Sempat di sini daftar
  // ini diambil dari `monthly_report_notes`, dan tab-nya berkata "belum ada
  // laporan" sementara halamannya membuka rekap penuh — dua jawaban berbeda
  // untuk satu pertanyaan, di halaman yang sama.
  const sekarang = await bulanIni()
  const laporan = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(sekarang.tahun, sekarang.bulan - 1 - i, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  })

  const { total, persen } = hitungKehadiran(sesi, new Map(Object.entries(attendanceMap)))
  const sudahBayar = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total_due), 0)
  const belumBayar = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + Number(i.total_due), 0)

  const kelasAktif = kelas.filter((k) => k.is_active)
  const kelasLampau = kelas.filter((k) => !k.is_active)

  // Tabel sesi hanya memuat kelas aktif, persis seperti halaman detail siswa
  // admin. Kelas yang sudah selesai diringkas di bawahnya lewat RiwayatKelas,
  // supaya ia tidak hilang sama sekali dari pandangan orang tua.
  const idKelasAktif = new Set(kelasAktif.map((k) => k.class_id))
  const sesiAktif = sesi.filter((s) => idKelasAktif.has(s.class_id))

  const ringkasanLampau = kelasLampau.map((k) => {
    const sesiKelas = sesi
      .filter((s) => s.class_id === k.class_id)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    return {
      id: k.class_id,
      name: k.classes?.name ?? 'Kelas',
      subject_names: mapelPerKelas.get(k.class_id) ?? [],
      jumlahSesi: sesiKelas.length,
      mulai: sesiKelas[0]?.scheduled_at ?? null,
      selesai: sesiKelas.at(-1)?.scheduled_at ?? null,
    }
  })

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

  const tabUrl = (t: string) => `/keluarga/${studentId}?tab=${t}`

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/keluarga" className="hover:text-blue-600 transition-colors">
          Anak
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{anak.full_name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <SiswaHeaderCard
            fullName={profil?.full_name ?? anak.full_name}
            nickname={profil?.nickname as string | null}
            grade={profil?.grade as string | null}
            isActive={(profil?.is_active as boolean | null) ?? true}
            avatarUrl={profil?.avatar_url as string | null}
          />

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <SiswaTabs
              tabs={[
                { key: 'jadwal', label: 'Kelas' },
                { key: 'tagihan', label: 'Tagihan', count: invoices.length },
                { key: 'laporan', label: 'Laporan', count: laporan.length },
              ]}
              active={aktif}
              hrefFor={tabUrl}
            />

            {aktif === 'jadwal' && (
              <div className="p-5 space-y-6">
                <JadwalTable
                  sekarangIso={waktuSekarang}
                  sessions={sesiAktif}
                  enrolledClasses={kelasAktif.map((k) => ({
                    id: k.class_id,
                    name: k.classes?.name ?? null,
                    is_active: k.is_active,
                    subject_name: null,
                    tutor: null,
                  }))}
                  subjectNameMap={subjectNameMap}
                  attendanceMap={attendanceMap}
                  sessionTutorMap={sessionTutorMap}
                  studentId={studentId}
                />
                <RiwayatKelas kelas={ringkasanLampau} />
              </div>
            )}

            {aktif === 'tagihan' && (
              <div className="p-5">
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">Belum ada tagihan.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-4 py-2.5">Nomor</th>
                          <th className="text-left px-4 py-2.5">Jatuh tempo</th>
                          <th className="text-left px-4 py-2.5">Status</th>
                          <th className="text-right px-4 py-2.5">Jumlah</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((i) => {
                          const s = statusTagihan[i.status as string] ?? {
                            teks: i.status as string,
                            kelas: 'bg-gray-100 text-gray-600',
                          }
                          return (
                            <tr key={i.id as string}>
                              <td className="px-4 py-3 text-gray-800">{i.invoice_number as string}</td>
                              <td className="px-4 py-3 text-gray-500">
                                {i.due_date
                                  ? new Date(i.due_date as string).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${s.kelas}`}>
                                  {s.teks}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                                {rupiah(Number(i.total_due))}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <a
                                  href={`/api/invoices/${i.id}/pdf`}
                                  className="text-xs font-medium text-blue-600 hover:underline"
                                >
                                  PDF
                                </a>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {aktif === 'laporan' && (
              <div className="p-5">
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
                  {laporan.map((m) => {
                    const [y, mo] = m.split('-').map(Number)
                    return (
                      <li key={m}>
                        <Link
                          href={`/keluarga/${studentId}/laporan?month=${m}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          <span className="text-sm text-gray-800">
                            {new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('id-ID', {
                              month: 'long',
                              year: 'numeric',
                              timeZone: 'UTC',
                            })}
                          </span>
                          <span className="text-xs text-blue-600">Buka →</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <SiswaSidebar
            profil={(profil ?? {}) as Record<string, string | null>}
            kelasAktif={kelasAktif.map((k) => ({
              id: k.class_id,
              name: k.classes?.name ?? null,
              schedule_days: k.classes?.schedule_days ?? [],
              schedule_time: k.classes?.schedule_time ?? null,
              subject_names: mapelPerKelas.get(k.class_id) ?? [],
            }))}
            totalSesi={total}
            hadirPersen={persen}
            sudahBayar={sudahBayar}
            belumBayar={belumBayar}
            bergabung={(profil?.created_at as string | null) ?? null}
            studentId={studentId}
          />

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Belajar</p>
            <div className="space-y-2 text-sm">
              <Link href={`/keluarga/${studentId}/materi`} className="block text-blue-600 hover:underline">
                Materi
              </Link>
              <Link href={`/keluarga/${studentId}/penguasaan`} className="block text-blue-600 hover:underline">
                Penguasaan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
