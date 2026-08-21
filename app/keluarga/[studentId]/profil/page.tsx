import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { createClient } from '@/lib/supabase/server'
import { muatKelasDanSesi } from '@/lib/keluarga-anak'
import { hitungKehadiran } from '@/lib/kehadiran'
import SiswaHeaderCard from '@/components/siswa/SiswaHeaderCard'
import SiswaSidebar from '@/components/siswa/SiswaSidebar'

/**
 * Profil anak: identitasnya, ringkasan angkanya, lalu pintu ke halaman yang
 * tidak cukup sering dibuka untuk mendapat tempat di bilah navigasi bawah.
 *
 * Kartu identitas dan kolom ringkasannya adalah komponen yang sama dengan yang
 * dipakai halaman detail siswa admin — bukan salinan. Orang tua dan admin yang
 * saling menelepon sambil melihat layar berbeda perlu membaca angka yang sama
 * dengan kata yang sama; dua salinan yang pelan-pelan menyimpang adalah cara
 * paling mudah untuk melanggar itu.
 *
 * Yang tetap milik admin: tombol Edit, blok Aksi, status kritis, dan UUID
 * (`tampilkanId={false}`). Semuanya alat kerja, bukan informasi tentang anaknya.
 */

const MENU = [
  {
    ke: 'tagihan',
    judul: 'Tagihan',
    teks: 'Riwayat tagihan dan pembayaran.',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    ),
  },
  {
    ke: 'materi',
    judul: 'Materi',
    teks: 'Bahan belajar untuk topik yang dibahas di kelas.',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    ke: 'penguasaan',
    judul: 'Penguasaan',
    teks: 'Topik mana yang sudah dikuasai, mana yang masih perlu latihan.',
    ikon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    ),
  },
]

export default async function ProfilAnak({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const supabase = await createClient()

  const { data: profil } = await supabase
    .from('profiles')
    .select('full_name, nickname, grade, created_at, is_active, avatar_url')
    .eq('id', studentId)
    .maybeSingle()

  const { data: invoiceRows } = await supabase
    .from('invoices')
    .select('total_due, status')
    .eq('student_id', studentId)
    .neq('status', 'draft')
  const invoices = (invoiceRows ?? []) as { total_due: number; status: string }[]

  const { kelasAktif, sesi, attendanceMap, mapelPerKelas } = await muatKelasDanSesi(studentId)
  const { total, persen } = hitungKehadiran(sesi, new Map(Object.entries(attendanceMap)))

  const sudahBayar = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total_due), 0)
  const belumBayar = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + Number(i.total_due), 0)

  return (
    <div className="space-y-5">
      <SiswaHeaderCard
        fullName={profil?.full_name ?? anak.full_name}
        nickname={profil?.nickname as string | null}
        grade={profil?.grade as string | null}
        isActive={(profil?.is_active as boolean | null) ?? true}
        avatarUrl={profil?.avatar_url as string | null}
      />

      <div className="rounded-xl bg-white shadow ring-1 ring-gray-900/5 divide-y divide-slate-100 overflow-hidden">
        {MENU.map((m) => (
          <Link
            key={m.ke}
            href={`/keluarga/${studentId}/${m.ke}`}
            className="flex items-center gap-3 p-4 active:bg-slate-50 hover:bg-gray-50 transition-colors"
          >
            <span className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {m.ikon}
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-900">{m.judul}</span>
              <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">{m.teks}</span>
            </span>
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <SiswaSidebar
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
        tampilkanId={false}
      />
    </div>
  )
}
