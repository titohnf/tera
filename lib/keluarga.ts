import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'

export interface Anak {
  id: string
  full_name: string
}

/**
 * Konteks portal keluarga: akun yang login beserta anak-anak yang dicakupnya.
 *
 * Sengaja memakai client biasa, BUKAN createAdminClient() seperti layout admin
 * dan tutor. Portal ini satu-satunya tempat orang luar organisasi membaca data
 * Tera, jadi policy keluarga di migrasi 076 harus benar-benar menjadi yang
 * menahan — bukan sekadar hiasan yang dilewati service key. Kalau ada policy
 * yang keliru, halamannya kosong dan itu ketahuan; dengan service key, kekeliruan
 * yang sama justru membocorkan data dan tidak terlihat sama sekali.
 */
export async function keluargaContext() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') redirect('/unauthorized')

  const { data: links } = await supabase
    .from('family_students')
    .select('student_id, profiles!family_students_student_id_fkey(id, full_name)')
    .order('student_id')

  const anak = ((links ?? []) as unknown as { profiles: Anak | null }[])
    .map((l) => l.profiles)
    .filter((a): a is Anak => a !== null)
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  return { user, namaKeluarga: profile.full_name as string, anak }
}

/**
 * Memastikan `studentId` di URL benar-benar anak keluarga ini.
 *
 * `jumlahAnak` ikut dikembalikan karena `anak` di sini menimpa daftar `anak`
 * milik konteks — pemanggil kehilangan cara menghitungnya. Halaman anak
 * memakainya untuk memutuskan apakah remah roti "Anak /" ada gunanya: keluarga
 * beranak satu selalu dilempar langsung ke halaman ini, jadi tidak ada daftar
 * untuk dituju kembali.
 */
export async function anakOrRedirect(studentId: string) {
  const ctx = await keluargaContext()
  const anak = ctx.anak.find((a) => a.id === studentId)
  if (!anak) redirect('/keluarga')
  return { ...ctx, anak, jumlahAnak: ctx.anak.length }
}

export function tanggalPanjang(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Batas waktu "mulai dari sekarang", dikurangi toleransi beberapa jam supaya
 * sesi yang sedang berjalan tidak hilang dari daftar.
 *
 * Diletakkan di sini, bukan di badan komponen, karena aturan lint
 * `react-hooks/purity` melarang pemanggilan fungsi tak-murni saat render —
 * termasuk membaca jam. Di server component asinkron hal itu sebenarnya sah,
 * tapi memisahkannya membuat maksudnya eksplisit dan lint tetap bersih.
 */
export async function sejakJam(toleransiJam: number) {
  return new Date(Date.now() - toleransiJam * 60 * 60 * 1000).toISOString()
}
