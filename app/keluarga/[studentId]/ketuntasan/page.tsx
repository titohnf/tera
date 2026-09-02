import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak, rubrikMapel } from '@/lib/belajar/sesi'
import { kemajuanTopikPeta } from '@/lib/belajar/topik-rapor'
import {
  labelPenguasaan,
  rentangPita,
  type PitaPenguasaan,
} from '@/lib/belajar/penguasaan'
import { persenDari } from '@/lib/belajar/penilaian'
import TabLaporan from '@/components/keluarga/TabLaporan'
import KartuPenguasaan from '@/components/keluarga/KartuPenguasaan'

/**
 * Ketuntasan Materi: peta kompetensi seorang anak — paket latihan bertingkat
 * yang mengukur penguasaan per topik.
 *
 * Bagian ini DULU ruang "Misi" di dalam tab Kompetensi (`/penguasaan`). Ia
 * dipindahkan ke tabnya sendiri karena isinya dijamin TERPISAH dari daftar
 * topik kurikulum: trigger migrasi 148 melarang butir ber-`topik_id` punya tag
 * kurikulum, jadi butir yang dihitung di sini tidak pernah sama dengan yang
 * dihitung di tab Kompetensi, dan penyebut paketnya pun berbeda — di sini paket
 * latihan saja, sementara paket ujian dilaporkan terpisah di dalam tiap topik.
 *
 * Menaruh dua penyebut berbeda di bawah satu layar hanya membingungkan; satu
 * tab per penyebut membuat batasnya tertulis di bilah ini, bukan tersirat.
 *
 * Angkanya dihitung lewat `kemajuanTopikPeta`, jalur yang sama dengan peta
 * `Misi` di portal anak — dua layar yang digambar orang tua dan anak tidak
 * boleh menjawab pertanyaan yang sama dengan selisih angka.
 */
export default async function KetuntasanMateriPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const learnerId = await learnerAnak(studentId)
  const misi = learnerId ? await kemajuanTopikPeta(learnerId) : []
  const misiDikerjakan = (misi ?? []).filter(k => k.answered > 0)

  // Satu rubrik per MAPEL, diambil sekali untuk tiap mapel yang muncul. Topik
  // peta meminjam mapelnya dari kurikulum lewat `topik_grup`, jadi "Baik" dan
  // "Istimewa" berarti sama dengan yang dibaca di tab Kompetensi.
  const mapel = [...new Set(misiDikerjakan.map(k => k.subjectId).filter(Boolean) as string[])]
  const rubrik = new Map<string, PitaPenguasaan[] | null>(
    await Promise.all(
      mapel.map(async id => [id, await rubrikMapel(id)] as [string, PitaPenguasaan[] | null]),
    ),
  )

  const baris = misiDikerjakan
    .map(k => {
      const persen = k.maxAvailable > 0 ? persenDari(k.score, k.maxAvailable) : null
      const pita = k.subjectId ? (rubrik.get(k.subjectId) ?? null) : null
      return {
        kunci: k.topikId,
        subjectId: k.subjectId,
        mapel: 'Misi',
        nama: k.nama,
        keterangan: [k.jenjangKelas && `Kelas ${k.jenjangKelas}`, k.topikId]
          .filter(Boolean)
          .join(' · '),
        persen,
        label: persen != null ? labelPenguasaan(pita, persen) : null,
        pitaKunci: pita ? JSON.stringify(rentangPita(pita)) : null,
        awal: null,
        paketTuntas: k.paketTuntas,
        paketSempurna: k.paketSempurna,
        paketTotal: k.paketTotal,
        dikerjakan: k.answered,
        total: k.total,
        tuntas: k.total > 0 && k.answered >= k.total,
        rincian: {
          correct: k.correct,
          partial: k.partial,
          wrong: k.wrong,
          belum: Math.max(0, k.total - k.answered),
        },
      }
    })
    .sort((a, b) => (a.persen ?? 101) - (b.persen ?? 101) || a.nama.localeCompare(b.nama, 'id'))

  return (
    <div className="space-y-6">
      <TabLaporan studentId={studentId} aktif="ketuntasan" />

      {/* Judul dan panah kembalinya ada di bilah atas (`HeaderKeluarga`). */}
      <p className="text-sm leading-relaxed text-gray-500">
        Penguasaan siswa terhadap tiap topik dari peta kompetensi.
      </p>

      {misi === null ? (
        <p className="rounded-xl bg-white p-6 text-sm leading-relaxed text-gray-500 shadow-kartu">
          Ketuntasannya belum bisa dibaca sekarang. Coba buka lagi sebentar lagi.
        </p>
      ) : baris.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-kartu">
          Belum ada latihan dari peta kompetensi yang dikerjakan.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <p className="font-semibold tracking-tight text-gray-900">Ketuntasan Materi</p>
            <p className="shrink-0 text-xs text-gray-400">{baris.length} topik</p>
          </div>
          <p className="px-1 text-xs leading-relaxed text-gray-400">
            Peta kompetensi Matematika: paket latihan bertingkat yang mengukur
            penguasaan per topik. Paket ujiannya dilaporkan terpisah di dalam
            tiap topik.
          </p>
          <ul className="space-y-3">
            {baris.map(b => (
              <KartuPenguasaan key={b.kunci} b={b} studentId={studentId} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}