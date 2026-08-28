import { anakOrRedirect } from '@/lib/keluarga'
import { muatKelasDanSesi } from '@/lib/keluarga-anak'
import { sekarangIso } from '@/lib/waktu'
import SesiKartuList from '@/components/keluarga/SesiKartuList'
import JadwalTable from '@/components/siswa/JadwalTable'
import RiwayatKelas from '@/components/siswa/RiwayatKelas'

/**
 * Riwayat kelas seorang anak: jadwal sesi dan apa yang terjadi di tiap sesi.
 *
 * Dulu ini tab "Kelas" di beranda, lalu naik jadi salah satu dari empat tombol
 * bilah bawah, dan kini turun lagi jadi petak ikon di beranda. Perpindahan
 * terakhir mengikuti apa yang sebenarnya dicari orang tua: bilah bawah untuk
 * yang dibuka tiap hari — beranda, kabar, profil — sedangkan riwayat dibuka
 * saat ada yang ingin ditelusuri, dan itu perilaku petak, bukan tab.
 *
 * Namanya ikut berubah jadi "Kelas". "Jadwal" menjanjikan yang akan datang,
 * padahal separuh isi halaman ini yang sudah lewat: kehadiran, topik yang
 * dibahas, materinya, nilai asesmen, dan catatan tutor. "Riwayat Kelas" —
 * nama antara yang sempat dipakai — memihak ke arah sebaliknya. "Kelas" tidak
 * memihak sisi waktu mana pun, dan sama dengan nama tab untuk rute ini di
 * portal admin.
 *
 * Rutenya tetap `/jadwal` — tautan yang sudah beredar tidak dipatahkan demi
 * nama, dan tidak ada seorang pun membaca alamat ini sebagai kalimat.
 *
 * Kelas yang sudah selesai tetap diringkas di bawah, bukan dibuang: anak yang
 * pindah kelas di tengah tahun akan kehilangan seluruh sejarahnya kalau
 * halaman ini hanya memuat kelas aktif.
 *
 * Bilah tab "Jadwal Kelas / Laporan" yang dulu di puncak halaman ikut dilepas
 * bersama pindahnya Laporan ke bawah Profil: bilah tab berisi satu tab bukan
 * pilihan, cuma judul yang menyamar jadi tombol.
 *
 * Satu kartu besar yang dulu membungkus semuanya kini dipecah per bagian, agar
 * saringan versi ponsel bisa berdiri di luar kartu daftar sesi.
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
      {/* Ponsel: kartu sesinya berdiri langsung di atas latar halaman, tanpa
          kartu pembungkus. Saringannya pun tidak di sini — ia berlabuh sebagai
          ikon di bilah judul (lihat `SaringSheet`). Layar lebar tetap satu
          kartu berisi tabel. */}
      <div className="lg:hidden">
        <SesiKartuList
          sessions={sesiAktif}
          subjectNameMap={subjectNameMap}
          attendanceMap={attendanceMap}
          sessionTutorMap={sessionTutorMap}
          studentId={studentId}
          sekarangIso={waktuSekarang}
        />
      </div>

      <div className="hidden lg:block bg-white rounded-xl shadow-kartu p-4 sm:p-5">
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

      {ringkasanLampau.length > 0 && (
        <div className="bg-white rounded-xl shadow-kartu p-4 sm:p-5">
          <RiwayatKelas kelas={ringkasanLampau} garisPemisah={false} />
        </div>
      )}
    </div>
  )
}
