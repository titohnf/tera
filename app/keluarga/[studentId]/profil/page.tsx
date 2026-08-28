import { anakOrRedirect } from '@/lib/keluarga'
import { kodeReferal } from '@/lib/referal'
import { createClient } from '@/lib/supabase/server'
import { muatKelasDanSesi } from '@/lib/keluarga-anak'
import { hitungKehadiran } from '@/lib/kehadiran'
import SiswaHeaderCard from '@/components/siswa/SiswaHeaderCard'
import SiswaSidebar from '@/components/siswa/SiswaSidebar'
import KartuAkun from '@/components/apps/KartuAkun'
import KartuReferal from '@/components/keluarga/KartuReferal'

/**
 * Profil anak: identitasnya, ringkasan angkanya, dan akun keluarganya.
 *
 * Empat pintu yang dulu ada di sini — Tagihan, Laporan Bulanan, Materi,
 * Penguasaan — pindah ke beranda sebagai petak ikon
 * (`components/keluarga/PintasanKeluarga`). Menaruhnya di bawah Profil berarti
 * setiap kunjungan ke Tagihan melewati satu halaman yang sama sekali tidak
 * dicari, dan halaman ini pun jadi dua hal sekaligus: tentang anaknya, dan
 * daftar isi portal.
 *
 * Kartu identitas dan kolom ringkasannya adalah komponen yang sama dengan yang
 * dipakai halaman detail siswa admin — bukan salinan. Orang tua dan admin yang
 * saling menelepon sambil melihat layar berbeda perlu membaca angka yang sama
 * dengan kata yang sama; dua salinan yang pelan-pelan menyimpang adalah cara
 * paling mudah untuk melanggar itu.
 *
 * Yang tetap milik admin: tombol Edit, blok Aksi, status kritis, dan UUID
 * (`tampilkanId={false}`). Semuanya alat kerja, bukan informasi tentang anaknya.
 *
 * Akun keluarganya sendiri — nama, email, dan tombol keluar — duduk di dasar
 * halaman ini sejak menu avatar di pojok kanan atas dilepas. Halaman ini yang
 * menampungnya karena "Profil" di bilah navigasi bawah memang tempat orang
 * mencari hal-hal tentang dirinya.
 *
 * Kode referal keluarga duduk tepat di atasnya, dengan alasan yang sama: ia
 * milik akun, bukan milik anak yang sedang dibuka. Banner di dasar beranda
 * menawarkannya; yang kembali mencari kodenya akan mencarinya di sini.
 */

export default async function ProfilAnak({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak, namaKeluarga, user } = await anakOrRedirect(studentId)
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

      <KartuReferal kode={kodeReferal(user.id)} />

      <KartuAkun nama={namaKeluarga} email={user.email ?? ''} />
    </div>
  )
}
