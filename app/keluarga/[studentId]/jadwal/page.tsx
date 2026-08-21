import { anakOrRedirect } from '@/lib/keluarga'
import { muatKelasDanSesi } from '@/lib/keluarga-anak'
import { sekarangIso } from '@/lib/waktu'
import RiwayatTabs from '@/components/keluarga/RiwayatTabs'
import SesiKartuList from '@/components/keluarga/SesiKartuList'
import JadwalTable from '@/components/siswa/JadwalTable'
import RiwayatKelas from '@/components/siswa/RiwayatKelas'

/**
 * Jadwal dan riwayat sesi seorang anak.
 *
 * Dulu ini tab "Kelas" di beranda. Isinya tidak berubah — daftar sesi kelas
 * aktif, lalu ringkasan kelas yang sudah selesai — yang berubah cuma tempatnya:
 * ia sekarang punya rutenya sendiri, jadi orang tua bisa mengirim tautannya dan
 * tombol kembali di ponsel berperilaku seperti yang mereka harapkan.
 *
 * Kelas yang sudah selesai tetap diringkas di bawah, bukan dibuang: anak yang
 * pindah kelas di tengah tahun akan kehilangan seluruh sejarahnya kalau
 * halaman ini hanya memuat kelas aktif.
 */
export default async function JadwalAnak({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const waktuSekarang = await sekarangIso()
  const {
    kelasAktif,
    kelasLampau,
    sesi,
    sesiAktif,
    attendanceMap,
    subjectNameMap,
    sessionTutorMap,
    mapelPerKelas,
  } = await muatKelasDanSesi(studentId)

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

  return (
    <div className="space-y-5">
      <RiwayatTabs studentId={studentId} aktif="jadwal" />

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4 sm:p-5 space-y-6">
        {/* Tabelnya meluber ~89px di layar 375px meski Mapel dan Tutor sudah
            disembunyikan, jadi di ponsel sesinya jadi kartu. Halaman admin
            tetap memakai tabel di semua ukuran. */}
        <div className="lg:hidden">
          <SesiKartuList
            sessions={sesiAktif}
            subjectNameMap={subjectNameMap}
            attendanceMap={attendanceMap}
            sessionTutorMap={sessionTutorMap}
            namaKelas={Object.fromEntries(
              kelasAktif.map((k) => [k.class_id, k.classes?.name ?? null]),
            )}
            studentId={studentId}
          />
        </div>
        <div className="hidden lg:block">
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
        </div>
        <RiwayatKelas kelas={ringkasanLampau} />
      </div>
    </div>
  )
}
