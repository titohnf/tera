import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { belajarContext } from '@/lib/belajar/konteks'
import { mapelLatihan, sesiTertunda } from '@/lib/belajar/sesi'
import PemilihLatihan from '@/components/belajar/PemilihLatihan'

/**
 * Pintu masuk permukaan belajar: memilih apa yang mau dilatih.
 *
 * `belajarContext()` selalu baris pertama — ia yang memutuskan atas nama siapa
 * halaman ini dibuka, dan ia pula yang memulangkan orang yang tidak berhak.
 * Sesi belum dibuat di sini; itu terjadi saat tombol "Mulai Latihan" ditekan,
 * dan sejak detik itu tempatnya pindah ke `/belajar/[sesiId]`.
 */
export default async function BelajarBeranda({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string; topik?: string }>
}) {
  const { anak, topik } = await searchParams
  const { learnerId, namaPelajar, avatar, kelas } = await belajarContext(anak)
  // Pengecualian jenjang per mapel (migrasi 105) TIDAK ikut di sini: ia
  // bergantung pada mapel mana yang dibuka, dan yang sedang disusun justru
  // daftar mapelnya. Yang dipakai kelas aslinya saja; pengecualiannya
  // menyusul di layar topik, tempat mapelnya sudah diketahui.
  const jenjang = kelas ? [`Kelas ${kelas}`] : []
  const [mapel, tertunda] = await Promise.all([
    mapelLatihan(learnerId, jenjang),
    sesiTertunda(learnerId),
  ])

  // `?topik=<group_id>` membuka langsung topik itu, dilewatkan rincian sesi di
  // portal keluarga. Yang dibutuhkan layar cuma MAPELNYA — daftar topik dimuat
  // di browser begitu mapelnya diketahui, dan topiknya dipilih dari situ.
  //
  // Ditelusuri di sini, bukan di browser: `curriculum_topic_groups` dibaca
  // lewat client sesi, jadi RLS tetap yang memutuskan (076 untuk keluarga, 126
  // untuk pelanggan). Topik yang tidak berhak dibaca pulang kosong, dan
  // halamannya cuma terbuka seperti biasa — bukan gagal.
  let awal: { subjectId: string; groupId: string } | null = null
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
      awal = { subjectId: baris.subject_id, groupId: baris.id }
    }
  }

  return (
    <div className="space-y-4">
      {/* Satu-satunya pintu menuju sesi yang belum selesai. Undiannya tersimpan
          sejak migrasi 114, tapi rute sesi tidak ditautkan dari mana pun —
          tanpa kartu ini, anak yang menutup tab kehilangan sesinya bukan karena
          datanya hilang melainkan karena tidak ada jalan kembali. */}
      {tertunda && (
        <Link
          href={`/belajar/${tertunda.sesiId}`}
          className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 shadow ring-1 ring-blue-200 transition hover:ring-blue-300 active:bg-blue-100"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-blue-900">
              {tertunda.tinggalHasil ? 'Lihat hasil latihan terakhir' : 'Lanjutkan latihan'}
            </span>
            <span className="block text-sm text-blue-700/80">
              {tertunda.tinggalHasil
                ? `${tertunda.jumlahSoal} soal sudah dijawab, hasilnya belum dibuka.`
                : `${tertunda.sudahDijawab} dari ${tertunda.jumlahSoal} soal sudah dijawab.`}
            </span>
          </span>
          <span className="shrink-0 text-blue-600" aria-hidden>
            →
          </span>
        </Link>
      )}

      <PemilihLatihan
        mapel={mapel}
        anak={anak}
        awal={awal}
        nama={namaPelajar}
        avatar={avatar}
        labelKelas={jenjang[0] ?? null}
      />
    </div>
  )
}
