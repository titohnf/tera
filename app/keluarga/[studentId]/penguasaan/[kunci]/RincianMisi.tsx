import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { learnerAnak, rubrikMapel } from '@/lib/belajar/sesi'
import { keadaanPaketTopik } from '@/lib/belajar/topik-peta'
import { isiPaketTopikSemua, kemajuanTopikPeta } from '@/lib/belajar/topik-rapor'
import { namaPaket } from '@/lib/belajar/nama-paket'
import { labelPenguasaan } from '@/lib/belajar/penguasaan'
import { persenDari } from '@/lib/belajar/penilaian'
import Keyakinan from '@/components/belajar/Keyakinan'
import BilahJawaban, {
  hasilSoal,
  KeteranganJawaban,
  NomorJawaban,
} from '@/components/belajar/BilahJawaban'

/**
 * Rincian satu topik MISI, untuk orang tua.
 *
 * SALINAN SENGAJA dari `RincianGrup`, bukan parameterisasinya. Tiga hal
 * berbeda sampai ke pangkalnya — dari mana id butirnya datang (RPC vs
 * `question_curriculum_tags`), apa yang membedakan sebuah paket (jenis dan
 * level Bloom vs nomor urut), dan apa yang BOLEH ditampilkan — dan satu
 * komponen bermuatan tiga diskriminator adalah cara salah satunya diam-diam
 * mulai menuruti aturan yang lain.
 *
 * SYARAT PENGHAPUSAN duplikasi ini, supaya ia utang bersyarat lunas dan bukan
 * utang abadi: keduanya dilebur ketika jalur grup tidak lagi melayani mapel
 * mana pun — yaitu ketika seluruh mapel punya peta kompetensi, syarat yang
 * sama dengan penghapusan keluarga `practice_paket_*` di migrasi 146.
 *
 * ⚠️ YANG TIDAK DIGAMBAR DI SINI, DAN KENAPA. `RincianGrup` menggambar satu
 * baris per putaran lengkap dengan kisi titik per soal. Di jalur peta, putaran
 * PERTAMA adalah Skor Putaran 1 — angka yang PRD FR3 larang ditampilkan ke
 * murid "dalam bentuk apa pun", dan yang migrasi 149 cabut dari `public`
 * dengan alasan bahwa fungsi di skema `public` adalah antarmuka. Sepuluh titik
 * berwarna tak kurang antarmuka; ia angka itu juga, dalam notasi lain. Jadi di
 * sini putaran cuma DICACAH ("3 putaran"), tidak digambar.
 *
 * Orang tua tetap mendapat yang dicarinya: keadaan tiap butir sekarang,
 * persentase tiap paket, bilah cakupan, dan pintu ke tiap soal beserta
 * pembahasannya. Rincian percobaan pertama tetap di `/tutor/pengukuran`, tempat
 * yang memang bergerbang tutor.
 *
 * Orang berikutnya yang menyalin dari `RincianGrup` akan tergoda menambahkan
 * kisi putaran itu kembali. Ini paragraf yang menjawabnya.
 */
export default async function RincianMisi({
  studentId,
  topikId,
}: {
  studentId: string
  topikId: string
}) {
  const learnerId = await learnerAnak(studentId)

  const [kemajuan, paket, isi] = await Promise.all([
    learnerId ? kemajuanTopikPeta(learnerId) : Promise.resolve([]),
    learnerId ? keadaanPaketTopik(learnerId, topikId) : Promise.resolve([]),
    learnerId ? isiPaketTopikSemua(learnerId, topikId) : Promise.resolve([]),
  ])

  const k = (kemajuan ?? []).find(x => x.topikId === topikId) ?? null

  if (!k) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm leading-relaxed text-gray-500 shadow-kartu">
        Topik ini tidak ada di peta kompetensi, atau belum aktif.
      </p>
    )
  }

  const rubrik = k.subjectId ? await rubrikMapel(k.subjectId) : null

  // Jawaban TERAKHIR tiap butir, hanya dari sesi jalur peta yang selesai —
  // dasar yang sama dengan `topik_paket_state` dan `topik_kemajuan`, supaya
  // petak di sini dan angka di kartu paket tidak pernah bercerita beda.
  //
  // Dibaca langsung lewat client sesi: `practice_answers` dan
  // `practice_sessions` memang terbuka untuk keluarganya sendiri (076 dan 115),
  // gerbangnya `practice_actor()`. Yang TIDAK dibaca dari sini:
  // `question_bank_items` — halaman ini tidak pernah menampilkan bunyi soal
  // maupun kuncinya.
  const supabase = await createClient()
  const itemIds = [...new Set(isi.map(b => b.itemId))]

  type Jawaban = {
    session_id: string
    question_bank_item_id: string
    score: number | string | null
    max_score: number | string | null
    answered_at: string
  }
  const { data: jawabanRows } =
    learnerId && itemIds.length
      ? await supabase
          .from('practice_answers')
          .select('session_id, question_bank_item_id, score, max_score, answered_at')
          .eq('learner_id', learnerId)
          .in('question_bank_item_id', itemIds)
          .order('answered_at', { ascending: true })
      : { data: null }
  const jawaban = (jawabanRows as Jawaban[] | null) ?? []

  const { data: sesiRows } = jawaban.length
    ? await supabase
        .from('practice_sessions')
        .select('id, finished_at, paket_topik_id')
        .in('id', [...new Set(jawaban.map(j => j.session_id))])
    : { data: null }
  const sesi = new Map(
    (
      (sesiRows as { id: string; finished_at: string | null; paket_topik_id: string | null }[] | null) ??
      []
    ).map(r => [r.id, r])
  )

  const terakhir = new Map<string, { skor: number; maks: number; sesiId: string }>()
  for (const j of jawaban) {
    const s = sesi.get(j.session_id)
    // Sesi jalur GRUP tidak boleh ikut. Migrasi 148 sudah menjamin butirnya
    // terpisah, tapi menyebutnya di sini membuat jaminan itu tidak perlu
    // dipercaya dari jauh.
    if (!s?.finished_at || !s.paket_topik_id) continue
    // `jawaban` urut dari yang terlama, jadi yang belakangan menimpa.
    terakhir.set(j.question_bank_item_id, {
      skor: Number(j.score ?? 0),
      maks: Number(j.max_score ?? 0),
      sesiId: j.session_id,
    })
  }

  // Butir dikelompokkan per paket, urut menurut `ord`-nya sendiri.
  const perPaket = new Map<string, { itemId: string; ord: number }[]>()
  for (const b of isi) {
    const ada = perPaket.get(b.paketId) ?? []
    ada.push({ itemId: b.itemId, ord: b.ord })
    perPaket.set(b.paketId, ada)
  }

  // Kartunya mengikuti urutan `keadaanPaketTopik` — latihan dulu menurut
  // nomornya, ujian di belakang. Angka tiap paket datang dari sana, bukan
  // dihitung ulang di sini.
  const kartuPaket = paket.map(p => {
    const soal = (perPaket.get(p.paketId) ?? []).sort((a, b) => a.ord - b.ord)
    return {
      paketId: p.paketId,
      // Nama seperti yang dibaca anaknya: "Paket C2 — Memahami", dan "Ujian"
      // tanpa level — dokumen fondasi Bagian 3.7 menuntut level ujian dicampur
      // tanpa diberi tahu, dan layar orang tua tidak boleh membocorkannya.
      nama: namaPaket({ jenis: p.jenis, levelBloom: p.levelBloom, nomor: p.nomor }),
      ujian: p.jenis === 'ujian',
      total: p.total,
      benar: p.benar,
      putaran: p.putaran,
      terkunci: p.terkunci,
      persen: p.maks > 0 ? persenDari(p.skor, p.maks) : null,
      petak: soal.map(({ itemId, ord }) => {
        const t = terakhir.get(itemId)
        return {
          nomor: ord,
          hasil: hasilSoal(t?.skor ?? null, t?.maks ?? null, !!t),
          // Rute peninjauan ORANG TUA: ia tidak pernah mengunci paket dan tidak
          // pernah membuka kunci yang masih tertutup. Di jalur ini aturan itu
          // lebih penting daripada di jalur grup — kunci yang terbuka di sini
          // mencemari sebuah pengukuran, bukan cuma satu putaran latihan.
          tautan: t
            ? `/keluarga/${studentId}/penguasaan/${topikId}/soal?sesi=${t.sesiId}&item=${itemId}`
            : null,
        }
      }),
    }
  })

  const persen = k.maxAvailable > 0 ? persenDari(k.score, k.maxAvailable) : null
  const label = persen != null ? labelPenguasaan(rubrik, persen) : null
  const rincian = {
    correct: k.correct,
    partial: k.partial,
    wrong: k.wrong,
    belum: Math.max(0, k.total - k.answered),
  }
  const adaUjian = kartuPaket.some(p => p.ujian)

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-kartu">
        <p className="text-xs text-gray-400">
          {['Misi', k.jenjangKelas && `Kelas ${k.jenjangKelas}`, k.topikId]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight text-gray-900">{k.nama}</p>

        {k.answered > 0 ? (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-gray-900">
                {persen == null ? '—' : `${persen}%`}
              </span>
              {label && <span className="text-sm font-medium text-gray-500">{label}</span>}
            </div>

            <Keyakinan
              tuntas={k.paketTuntas}
              sempurna={k.paketSempurna}
              total={k.paketTotal}
              className="mt-1.5"
            />

            {/* Penyebutnya paket LATIHAN saja, sama persis dengan peta yang
                dilihat anaknya. Kalau paket ujian ikut dihitung di sini, peta
                anak akan berkata "tuntas" pada hari yang sama layar ini berkata
                60% — dua angka penguasaan untuk satu topik, di satu keluarga. */}
            <p className="mt-4 text-xs font-medium text-gray-500">
              Cakupan soal paket latihan
            </p>
            <BilahJawaban rincian={rincian} total={k.total} className="mt-2" />
            <KeteranganJawaban rincian={rincian} className="mt-3" />
            <p className="mt-2 text-xs text-gray-400 tabular-nums">
              {k.answered}/{k.total} soal dikerjakan
            </p>
            {adaUjian && (
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                Paket ujiannya tidak ikut dihitung di angka ini; hasilnya berdiri sendiri di
                kartu bawah.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Belum ada paket yang dikerjakan di topik ini.
          </p>
        )}
      </div>

      {kartuPaket.length > 0 && (
        <div className="space-y-2">
          <div className="px-1">
            <p className="font-semibold tracking-tight text-gray-900">Proses belajarnya</p>
          </div>

          {kartuPaket.map(p => (
            <div key={p.paketId} className="rounded-xl bg-white p-4 shadow-kartu">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">{p.nama}</span>
                <span className="text-sm text-gray-500 tabular-nums">
                  {p.benar}/{p.total} benar
                </span>
                {p.persen != null && (
                  <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                    {p.persen}%
                  </span>
                )}
              </div>

              {p.terkunci && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Terkunci — kunci jawabannya sudah dibuka
                </p>
              )}

              {/* Kolomnya diturunkan dari jumlah butir PAKET INI, bukan dari
                  `SOAL_PER_PAKET`. Paket peta tidak dibagi sepuluh-sepuluh:
                  paket latihan D-01 berisi delapan butir dan paket ujiannya dua
                  puluh, dan konstanta jalur grup akan menggambar kisi yang
                  tidak ada hubungannya dengan isinya. */}
              <NomorJawaban
                soal={p.petak}
                tautan={n => p.petak.find(x => x.nomor === n)?.tautan ?? null}
                kolom={Math.min(p.total, Math.max(4, Math.ceil(p.total / 2)))}
                className="mt-3"
              />

              {/* Putaran DICACAH, tidak digambar. Lihat kepala berkas: di jalur
                  ini putaran pertama adalah Skor Putaran 1. */}
              {p.putaran > 0 && (
                <p className="mt-3 border-t border-gray-100 pt-2.5 text-xs text-gray-400">
                  {p.putaran} putaran dikerjakan
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ke Misi, BUKAN ke `/belajar?topik=`. Yang terakhir berkunci grup
          kurikulum dan tidak bisa menampilkan topik ini sama sekali. */}
      <Link
        href={`/keluarga/${studentId}/misi`}
        className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Buka di Misi
      </Link>
    </div>
  )
}
