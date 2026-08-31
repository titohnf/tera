import { createClient } from '@/lib/supabase/server'
import { belajarContext } from '@/lib/belajar/konteks'
import { mapelLatihan } from '@/lib/belajar/sesi'
import PemilihLatihan from '@/components/belajar/PemilihLatihan'
import BilahKeluarga from '@/components/belajar/BilahKeluarga'
import { notifikasiAnak } from '@/lib/keluarga-notifikasi'
import { keluargaContext } from '@/lib/keluarga'

/**
 * Pintu masuk permukaan belajar: memilih apa yang mau dilatih.
 *
 * `belajarContext()` selalu baris pertama — ia yang memutuskan atas nama siapa
 * halaman ini dibuka, dan ia pula yang memulangkan orang yang tidak berhak.
 * Sesi belum dibuat di sini; itu terjadi saat tombol "Mulai Latihan" ditekan,
 * dan sejak detik itu tempatnya pindah ke `/belajar/[sesiId]`.
 *
 * Kartu "Lanjutkan latihan" pernah berdiri di puncak layar ini. Ia pindah ke
 * beranda portal keluarga. Langkah-langkah memilih mapel dan topik seluruhnya
 * hidup di browser, di dalam halaman yang sama — jadi kartu itu tidak
 * menyingkir saat mapel dipilih melainkan ikut ke setiap langkahnya, menawarkan
 * sesi LAIN tepat selagi seseorang sedang menyusun sesi yang baru. Di beranda
 * ia muncul sekali, di layar tempat orang belum memutuskan apa-apa.
 */
export default async function BelajarBeranda({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string; topik?: string; mapel?: string; lingkup?: string }>
}) {
  const { anak, topik, mapel: mapelDiminta, lingkup } = await searchParams
  const { learnerId, namaPelajar, avatar, kelas, studentId } = await belajarContext(anak)
  // Pengecualian jenjang per mapel (migrasi 105) TIDAK ikut di sini: ia
  // bergantung pada mapel mana yang dibuka, dan yang sedang disusun justru
  // daftar mapelnya. Yang dipakai kelas aslinya saja; pengecualiannya
  // menyusul di layar topik, tempat mapelnya sudah diketahui.
  const jenjang = kelas ? [`Kelas ${kelas}`] : []
  const mapel = await mapelLatihan(learnerId, jenjang)

  // `?topik=<group_id>` membuka langsung topik itu, dilewatkan rincian sesi di
  // portal keluarga dan tombol "Ulangi Topik Ini" di halaman hasil. Yang
  // dibutuhkan layar cuma MAPELNYA — daftar topik dimuat di browser begitu
  // mapelnya diketahui, dan topiknya dipilih dari situ.
  //
  // `?mapel=` datang dari tempat lain: langkah-langkah di browser mencatat
  // dirinya ke alamat (lihat `PemilihLatihan`), jadi alamat yang dibuka ulang
  // atau dibagikan harus mendarat di langkah yang sama. Tanpa ini, satu kali
  // muat ulang di daftar topik melempar orang kembali ke daftar mapel.
  //
  // `?lingkup=kelas` menandai lewat pintu mana mapelnya dibuka — segmen
  // "Tersedia di Kelasmu" atau katalog seluruh kelas. Isi layarnya berbeda,
  // jadi ia ikut disimpan; tanpa itu muat ulang bisa membuka daftar yang lebih
  // panjang daripada yang tadi ditinggalkan.
  //
  // Ditelusuri di sini, bukan di browser: `curriculum_topic_groups` dibaca
  // lewat client sesi, jadi RLS tetap yang memutuskan (076 untuk keluarga, 126
  // untuk pelanggan). Topik yang tidak berhak dibaca pulang kosong, dan
  // halamannya cuma terbuka seperti biasa — bukan gagal.
  let awal: { subjectId: string; groupId?: string; kelas?: boolean } | null = null
  const lewatKelas = lingkup === 'kelas' ? true : lingkup ? false : undefined
  if (topik) {
    const { data } = await (await createClient())
      .from('curriculum_topic_groups')
      .select('id, subject_id')
      .eq('id', topik)
      .maybeSingle()
    const baris = data as { id: string; subject_id: string } | null
    // Hanya kalau mapelnya memang ditawarkan ke pelajar ini. Tanpa syarat itu,
    // sebuah tautan lama bisa membuka mapel yang sudah tidak punya apa-apa
    // untuknya, dan layarnya berhenti di daftar topik kosong tanpa penjelasan.
    if (baris && mapel.some(m => m.subject_id === baris.subject_id)) {
      awal = { subjectId: baris.subject_id, groupId: baris.id, kelas: lewatKelas }
    }
  } else if (mapelDiminta && mapel.some(m => m.subject_id === mapelDiminta)) {
    // Syaratnya sama dengan jalur `?topik=`: hanya mapel yang memang
    // ditawarkan ke pelajar ini. Alamat lama yang menunjuk mapel yang sudah
    // tidak punya apa-apa untuknya cuma terbuka di daftar mapel, bukan gagal.
    awal = { subjectId: mapelDiminta, kelas: lewatKelas }
  }

  // Perabot portal keluarga ikut dirender di layar ini — lihat `BilahKeluarga`.
  // `studentId` terisi hanya untuk jalur keluarga, jadi pelanggan langganan
  // melewati kedua kueri ini sama sekali; `keluargaContext()` bahkan akan
  // memulangkan mereka ke /unauthorized kalau ikut dipanggil.
  //
  // Dari notifikasi yang diturunkan cuma DAFTAR ID, dengan alasan yang sama
  // seperti di rangka portal: mana yang sudah dibaca tersimpan di perangkat
  // masing-masing, jadi server tidak bisa menghitungnya.
  const keluarga = studentId
    ? await Promise.all([notifikasiAnak(studentId), keluargaContext()])
    : null

  return (
    <div className="space-y-4">
      <PemilihLatihan
        mapel={mapel}
        anak={anak}
        awal={awal}
        nama={namaPelajar}
        avatar={avatar}
        labelKelas={jenjang[0] ?? null}
      />

      {studentId && keluarga && (
        <BilahKeluarga
          studentId={studentId}
          idNotifikasi={keluarga[0].items.map((n) => n.id)}
          anak={keluarga[1].anak}
        />
      )}
    </div>
  )
}
