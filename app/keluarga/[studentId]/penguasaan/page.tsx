import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect } from '@/lib/keluarga'
import { kemajuanTopik, learnerAnak, rubrikMapel } from '@/lib/belajar/sesi'
import {
  labelPenguasaan,
  rentangPita,
  type PitaPenguasaan,
} from '@/lib/belajar/penguasaan'
import BilahJawaban, { KeteranganJawaban } from '@/components/belajar/BilahJawaban'
import { persenDari } from '@/lib/belajar/penilaian'
import Keyakinan from '@/components/belajar/Keyakinan'
import TabLaporan from '@/components/keluarga/TabLaporan'

/**
 * Penguasaan per topik untuk satu anak.
 *
 * Angkanya TIDAK dihitung di sini. Halaman ini pernah membaca `practice_answers`
 * sendiri dan menjumlahkan semuanya — dan karena aturannya disusun terpisah, ia
 * menjawab pertanyaan yang berbeda dari daftar topik di `/belajar` dengan kata
 * yang sama: seluruh jawaban seumur hidup (tiap pengulangan menambah pembilang
 * dan penyebut) melawan jawaban terakhir per soal. Untuk satu topik yang sama,
 * "17% · 12 soal dikerjakan" di sini dan "18% · 11/11 dikerjakan" di sana — dua
 * layar yang dibuka orang tua yang sama pada hari yang sama.
 *
 * Sekarang keduanya memanggil `kemajuanTopik()` (migrasi 128). Selisihnya tidak
 * bisa muncul lagi, bukan karena keduanya dijaga tetap sama melainkan karena
 * angkanya cuma ada satu.
 *
 * Yang berubah dari cara lama, dan kenapa:
 *
 * - **Jawaban terakhir, bukan rata-rata seumur hidup.** Mengulang topik sampai
 *   membaik adalah cara belajar yang kita harapkan; rata-rata menahan nilai
 *   pertama yang buruk selamanya, jadi perbaikannya tidak pernah terlihat.
 *   Nilai pertamanya tidak dibuang melainkan DISEBUTKAN ("naik dari 10%"),
 *   supaya 100% yang datang sesudah membaca pembahasan tidak terbaca seolah
 *   sekali jadi.
 * - **Soal berbeda, dengan penyebutnya.** "12 soal dikerjakan" di topik yang
 *   isinya 11 soal adalah kalimat yang tidak bisa dijelaskan ke orang tua.
 *   Sekarang "11/11", dan penyebutnya datang dari kumpulan soal yang sama
 *   dengan yang dipakai menu latihan.
 * - **Bilah dan persen mengukur hal yang BERBEDA.** Bilahnya cakupan — berapa
 *   soal dari berapa — karena cuma itu yang benar-benar berbentuk "sekian dari
 *   sekian". Persennya penguasaan atas SELURUH soal topik (migrasi 129), yang
 *   belum dikerjakan terhitung belum dikuasai. Dulu keduanya satu angka, dan
 *   akibatnya satu soal benar dari tiga tampil sebagai "100% · Istimewa"
 *   dengan bilah penuh — tiga klaim keliru sekaligus untuk anak yang baru
 *   menyentuh sepertiga topiknya.
 * - **Rubrik per mapel.** Labelnya lewat `mastery_rubric_for` seperti halaman
 *   hasil, bukan lewat baris rubrik global yang dibaca langsung. Hari ini
 *   keduanya kebetulan sama — baris rubrik yang ada baru satu, yang global —
 *   dan justru itu sebabnya perbedaannya harus ditutup sekarang: rubrik mapel
 *   pertama yang dibuat akan membuat dua layar menyebut nama berbeda untuk
 *   angka yang sama, tanpa ada yang mengubah halaman ini.
 * - **Soal bertanda dua topik dihitung di keduanya.** Peta lama berkunci id
 *   soal, jadi yang kedua diam-diam menimpa yang pertama. `practice_summary`
 *   (092) dan 128 sengaja menghitungnya di kedua topiknya: pertanyaannya
 *   "sejauh apa topik ini dikuasai", bukan "apakah jumlahnya seratus persen".
 * - **Kueri seukuran anaknya, bukan seukuran kurikulum.** Dulu SELURUH
 *   `question_curriculum_tags` dan SELURUH `curriculum_topic_groups` (485 baris
 *   dan terus bertambah) ditarik ke memori hanya untuk menamai beberapa topik.
 *   Sekarang yang dibaca cuma topik yang memang punya jawaban.
 */
export default async function PenguasaanPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  // `learnerAnak()` cuma MEMBACA — lihat catatannya di `sesi.ts`. Memanggil
  // `belajarContext()` di sini akan melahirkan baris `learners` untuk anak yang
  // halaman penguasaannya kebetulan dibuka, padahal ia belum pernah berlatih.
  const learnerId = await learnerAnak(studentId)
  const kemajuan = learnerId ? await kemajuanTopik(learnerId) : []

  const dikerjakan = (kemajuan ?? []).filter(k => k.answered > 0)

  const supabase = await createClient()
  const { data: topikRows } = dikerjakan.length
    ? await supabase
        .from('curriculum_topic_groups')
        .select('id, theme, topic, grade_level, subject_id, subjects(name)')
        .in(
          'id',
          dikerjakan.map(k => k.group_id),
        )
    : { data: null }

  type TopikRow = {
    id: string
    theme: string | null
    topic: string
    grade_level: string
    subject_id: string | null
    subjects: { name: string } | null
  }
  const topik = new Map(((topikRows as TopikRow[] | null) ?? []).map(t => [t.id, t]))

  // Satu rubrik per MAPEL, diambil sekali untuk tiap mapel yang muncul — bukan
  // sekali per baris. Anak yang mengerjakan dua puluh topik biasanya cuma
  // menyentuh dua atau tiga mapel.
  const mapelIds = [...new Set([...topik.values()].map(t => t.subject_id).filter(Boolean))]
  const rubrik = new Map<string, PitaPenguasaan[] | null>(
    await Promise.all(
      mapelIds.map(async id => [id!, await rubrikMapel(id!)] as [string, PitaPenguasaan[] | null]),
    ),
  )

  const baris = dikerjakan
    .map(k => {
      const t = topik.get(k.group_id)
      // Penyebutnya SELURUH soal topik, bukan yang sudah dijawab saja, dan
      // pembilangnya hanya jawaban dari putaran yang selesai (migrasi 134).
      // Null berarti penyebutnya tidak diketahui — bukan nol persen.
      const persen = k.max_available > 0 ? persenDari(k.score, k.max_available) : null
      const awal = k.max_available > 0 ? persenDari(k.first_score, k.max_available) : null
      const pita = t?.subject_id ? (rubrik.get(t.subject_id) ?? null) : null
      return {
        groupId: k.group_id,
        subjectId: t?.subject_id ?? null,
        // Topik yang sudah dihapus dari kurikulum tetap disebut: jawabannya
        // sungguh terjadi, dan baris tanpa nama lebih jujur daripada baris yang
        // hilang tanpa kabar.
        mapel: t?.subjects?.name ?? 'Topik di luar kurikulum',
        nama: t?.topic ?? 'Topik yang sudah tidak ada di kurikulum',
        // Nama mapelnya TIDAK ikut lagi: sejak daftarnya dikelompokkan per
        // mapel, judul kelompoknya sudah menyebutkannya, dan mengulanginya di
        // tiap kartu cuma memakan baris pertama yang seharusnya menerangkan
        // jenjang dan temanya.
        keterangan: t ? [t.grade_level, t.theme].filter(Boolean).join(' · ') : null,
        persen,
        label: persen != null ? labelPenguasaan(pita, persen) : null,
        pitaKunci: pita ? JSON.stringify(rentangPita(pita)) : null,
        // Hanya kalau ada soal yang diulang — kalau tidak, ia cuma mengulang
        // angka yang sudah tertulis di sebelahnya.
        awal: k.first_score !== k.score ? awal : null,
        paketTuntas: k.paket_tuntas,
        paketSempurna: k.paket_sempurna,
        paketTotal: k.paket_total,
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
    // Yang penguasaannya tidak diketahui turun ke bawah: urutan ini janji
    // "paling perlu dikuatkan di atas", dan baris tanpa angka tidak bisa ikut
    // menjanjikannya.
    .sort((a, b) => (a.persen ?? 101) - (b.persen ?? 101) || a.nama.localeCompare(b.nama, 'id'))

  // Dikelompokkan per MAPEL, dan mapelnya sendiri diurut menurut topik
  // terlemahnya. Dua hal sekaligus: struktur (orang tua membaca rapor per
  // mapel, bukan sebagai satu daftar panjang lintas pelajaran) tanpa kehilangan
  // janji urutannya — mapel yang memuat topik terlemah tetap yang pertama
  // terbaca, dan di dalamnya topik terlemah tetap di atas.
  const perMapel = new Map<string, typeof baris>()
  for (const b of baris) {
    const kunci = b.subjectId ?? 'lain'
    const ada = perMapel.get(kunci)
    if (ada) ada.push(b)
    else perMapel.set(kunci, [b])
  }
  const kelompok = [...perMapel.values()]

  // Ringkasan: berapa topik yang pernah disentuh, berapa yang seluruh soalnya
  // sudah dikerjakan, dan sebaran pitanya. Ini yang membedakan sebuah RAPOR
  // dari sekadar daftar — daftar menjawab "topik ini bagaimana", ringkasan
  // menjawab "anak saya bagaimana", dan pertanyaan kedua itu yang dibawa orang
  // tua saat membuka menu ini.
  const tuntas = baris.filter(b => b.tuntas).length
  // Sebarannya dihitung PER RUBRIK, bukan atas seluruh baris sekaligus: dua
  // mapel boleh punya pita berbeda, dan mencampur hitungannya berarti satu
  // kolom "Baik" yang diam-diam berisi dua ambang yang berlainan.
  const sebaran = new Map<string, Map<string, number>>()
  for (const b of baris) {
    if (!b.pitaKunci || !b.label) continue
    const ada = sebaran.get(b.pitaKunci) ?? new Map<string, number>()
    ada.set(b.label, (ada.get(b.label) ?? 0) + 1)
    sebaran.set(b.pitaKunci, ada)
  }

  return (
    <div className="space-y-6">
      <TabLaporan studentId={studentId} aktif="kompetensi" />

      {/* Judul dan panah kembalinya ada di bilah atas (`HeaderKeluarga`). */}
      <p className="text-sm leading-relaxed text-gray-500">
        Menampilkan persentase penguasaan siswa terhadap suatu topik pelajaran.
      </p>

      {kemajuan === null ? (
        // Kuerinya gagal. TIDAK dibungkus jadi "belum ada latihan": kalimat itu
        // menuduh anaknya belum mengerjakan apa-apa untuk sesuatu yang salah di
        // sisi kita.
        <p className="rounded-xl bg-white p-6 text-sm leading-relaxed text-gray-500 shadow-kartu">
          Penguasaannya belum bisa dibaca sekarang. Coba buka lagi sebentar lagi.
        </p>
      ) : baris.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-kartu">
          Belum ada latihan mandiri yang dikerjakan, jadi penguasaannya belum bisa dihitung.
        </p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4 shadow-kartu">
            <p className="text-sm leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-900">{baris.length} topik</span> pernah
              dikerjakan
              {tuntas > 0 && (
                <>
                  , <span className="font-semibold text-gray-900">{tuntas}</span> di antaranya sudah
                  dikerjakan seluruh soalnya
                </>
              )}
              .
            </p>

            {/* Sebaran pita SEKALIGUS legendanya. Dulu dua hal terpisah —
                legenda yang menerangkan ambang, dan tidak ada yang menghitung
                berapa topik jatuh di mana. Digabung, tiap baris mengerjakan
                keduanya, dan tabel yang menerangkan arti kata sekaligus
                menjawab "berapa banyak" lebih layak menempati ruang itu. */}
            {[...sebaran.entries()].map(([kunci, hitung]) => (
              <dl key={kunci} className="mt-3 space-y-1">
                {(JSON.parse(kunci) as { label: string; dari: number; sampai: number }[]).map(p => (
                  <div key={p.label} className="flex items-baseline gap-3 text-sm">
                    <dt className="w-24 shrink-0 font-medium text-gray-900">{p.label}</dt>
                    <dd className="w-20 shrink-0 text-gray-400 tabular-nums">
                      {p.dari}–{p.sampai}%
                    </dd>
                    <dd className="tabular-nums text-gray-500">
                      {hitung.get(p.label) ? (
                        <span className="font-semibold text-gray-900">{hitung.get(p.label)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                      {hitung.get(p.label) ? ' topik' : ''}
                    </dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>

          {kelompok.map(rows => (
            <div key={rows[0].subjectId ?? 'lain'} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 px-1">
                <p className="font-semibold tracking-tight text-gray-900">{rows[0].mapel}</p>
                <p className="shrink-0 text-xs text-gray-400">{rows.length} topik</p>
              </div>

              <ul className="space-y-3">
                {rows.map(b => (
                  <li key={b.groupId}>
                    {/* Seluruh kartunya tautan, bukan cuma namanya: sasaran
                        sentuh setinggi kartunya sendiri adalah satu-satunya
                        ukuran yang masuk akal di ponsel. */}
                    <Link
                      href={`/keluarga/${studentId}/penguasaan/${b.groupId}`}
                      className="block rounded-xl bg-white p-4 shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-50"
                    >
                      {b.keterangan && <p className="text-xs text-gray-400">{b.keterangan}</p>}
                      <div className="flex items-start justify-between gap-3">
                        <p className="mt-0.5 min-w-0 font-semibold tracking-tight text-gray-900">
                          {b.nama}
                        </p>
                        <span className="shrink-0 text-gray-300" aria-hidden>
                          ›
                        </span>
                      </div>

                      {/* Angka penguasaannya berdiri sendiri dan besar. Ia
                          jawaban atas pertanyaan yang membawa orang ke layar
                          ini, dan sebagai ekor di ujung baris judul ia harus
                          dicari dulu. */}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tabular-nums text-gray-900">
                          {b.persen == null ? '—' : `${b.persen}%`}
                        </span>
                        {b.label && (
                          <span className="text-sm font-medium text-gray-500">{b.label}</span>
                        )}
                        {/* Keyakinan menempel pada angkanya, bukan di ujung
                            baris: ia mengubah arti angka itu. Bentuk ringkas —
                            titiknya saja — karena di daftar sepanjang ini
                            kalimat "3 paket dikerjakan" di tiap baris jadi
                            kebisingan; kalimat lengkapnya tetap terbaca pembaca
                            layar lewat `aria-label`. */}
                        <Keyakinan
                          tuntas={b.paketTuntas}
                          sempurna={b.paketSempurna}
                          total={b.paketTotal}
                          ringkas
                          className="ml-1"
                        />
                        <span className="ml-auto shrink-0 text-xs text-gray-400 tabular-nums">
                          {b.dikerjakan}/{b.total} soal dikerjakan
                        </span>
                      </div>

                      <BilahJawaban rincian={b.rincian} total={b.total} className="mt-2" />
                      <KeteranganJawaban rincian={b.rincian} className="mt-2.5" />

                      {b.awal != null && b.persen != null && (
                        <p className="mt-2 text-xs text-gray-400">
                          {b.awal < b.persen
                            ? `Naik dari ${b.awal}% saat soal-soalnya pertama dijawab.`
                            : `Saat pertama dijawab ${b.awal}%.`}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
