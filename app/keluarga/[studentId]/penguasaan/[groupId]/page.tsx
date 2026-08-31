import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect } from '@/lib/keluarga'
import { isiPaket, keadaanPaket, kemajuanTopik, learnerAnak, rubrikMapel } from '@/lib/belajar/sesi'
import { labelPenguasaan } from '@/lib/belajar/penguasaan'
import { persenDari } from '@/lib/belajar/penilaian'
import { SOAL_PER_PAKET } from '@/lib/belajar/aturan'
import Keyakinan from '@/components/belajar/Keyakinan'
import BilahJawaban, {
  hasilSoal,
  KeteranganJawaban,
  NomorJawaban,
  TitikHasil,
} from '@/components/belajar/BilahJawaban'

/**
 * Rincian satu topik: bukan angkanya lagi, melainkan bagaimana angka itu jadi.
 *
 * Daftar Penguasaan menjawab "topik mana yang perlu dikuatkan". Pertanyaan
 * berikutnya selalu sama dan tidak punya tempat untuk dijawab: sudah dicoba
 * berapa kali, kapan, dan apakah membaik. Sebelum halaman ini, satu-satunya
 * jejak proses itu adalah halaman hasil sebuah sesi — yang cuma bisa dilihat
 * sekali, persis setelah sesinya selesai.
 *
 * Yang dibaca langsung dari tabel, lewat client sesi: `practice_answers` dan
 * `practice_sessions` memang terbuka untuk keluarganya sendiri (076 dan 115),
 * dan gerbangnya `practice_actor()` — sama dengan yang menjaga seluruh keluarga
 * fungsi `practice_*`. Yang TIDAK dibaca: `question_bank_items`. Halaman ini
 * tidak pernah menampilkan bunyi soal maupun kuncinya — orang tua di sini
 * sedang melihat proses anaknya, bukan bank soalnya.
 *
 * Angka besar di atas tetap datang dari `kemajuanTopik()`, sumber yang sama
 * dengan daftar Penguasaan dan menu latihan. Riwayat di bawahnya dihitung
 * sendiri dari baris jawaban — dan itu boleh, karena yang dihitung berbeda:
 * bukan penguasaan topiknya, melainkan apa yang terjadi di satu sesi.
 */
export default async function RincianTopik({
  params,
}: {
  params: Promise<{ studentId: string; groupId: string }>
}) {
  const { studentId, groupId } = await params
  await anakOrRedirect(studentId)
  const supabase = await createClient()

  const { data: topikRow } = await supabase
    .from('curriculum_topic_groups')
    .select('id, topic, theme, grade_level, subject_id, subjects(name)')
    .eq('id', groupId)
    .maybeSingle()
  const topik = topikRow as {
    id: string
    topic: string
    theme: string | null
    grade_level: string
    subject_id: string | null
    subjects: { name: string } | null
  } | null

  if (!topik) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm leading-relaxed text-gray-500 shadow-kartu">
        Topik ini sudah tidak ada di kurikulum.
      </p>
    )
  }

  const learnerId = await learnerAnak(studentId)
  const [kemajuan, rubrik, paketTopik, isi] = await Promise.all([
    learnerId ? kemajuanTopik(learnerId, topik.subject_id ?? undefined) : Promise.resolve([]),
    topik.subject_id ? rubrikMapel(topik.subject_id) : Promise.resolve(null),
    learnerId ? keadaanPaket(learnerId, groupId) : Promise.resolve([]),
    learnerId ? isiPaket(learnerId, groupId) : Promise.resolve([]),
  ])
  const k = (kemajuan ?? []).find(x => x.group_id === groupId) ?? null

  // Soal-soal topik ini, lalu jawaban si anak atas soal-soal itu. Dua langkah,
  // bukan satu join: `question_curriculum_tags` dan `practice_answers` tidak
  // punya hubungan langsung yang bisa ditembus PostgREST.
  const { data: tagRows } = await supabase
    .from('question_curriculum_tags')
    .select('question_bank_item_id')
    .eq('group_id', groupId)
  const soalIds = [
    ...new Set(((tagRows as { question_bank_item_id: string }[] | null) ?? []).map(t => t.question_bank_item_id)),
  ]

  type Jawaban = {
    session_id: string
    question_bank_item_id: string
    score: number | string | null
    max_score: number | string | null
    answered_at: string
  }
  const { data: jawabanRows } =
    learnerId && soalIds.length
      ? await supabase
          .from('practice_answers')
          .select('session_id, question_bank_item_id, score, max_score, answered_at')
          .eq('learner_id', learnerId)
          .in('question_bank_item_id', soalIds)
          .order('answered_at', { ascending: true })
      : { data: null }
  const jawaban = ((jawabanRows as Jawaban[] | null) ?? []).map(j => ({
    ...j,
    score: Number(j.score ?? 0),
    max: Number(j.max_score ?? 0),
  }))

  const { data: sesiRows } = jawaban.length
    ? await supabase
        .from('practice_sessions')
        .select('id, item_ids, started_at, finished_at, paket_index')
        .in('id', [...new Set(jawaban.map(j => j.session_id))])
    : { data: null }
  const sesi = new Map(
    (
      (sesiRows as
        | {
            id: string
            item_ids: string[] | null
            started_at: string
            finished_at: string | null
            paket_index: number | null
          }[]
        | null) ?? []
    ).map(r => [r.id, r])
  )

  // Jawaban dikelompokkan per sesi lebih dulu. Yang dicacah SOAL, bukan baris
  // jawaban: `practice_record_answer` menyisipkan tanpa kunci unik, jadi satu
  // soal bisa punya dua baris di sesi yang sama — ketukan ganda, halaman yang
  // dimuat ulang di detik yang salah — dan menghitung barisnya membuat "11 dari
  // 10 soal benar".
  const perSesi = new Map<string, Map<string, { skor: number; maks: number }>>()
  // Cadangan tanggal untuk sesi yang barisnya tidak terbaca: jawaban pertamanya.
  const jawabPertama = new Map<string, string>()
  for (const j of jawaban) {
    const ada = perSesi.get(j.session_id) ?? new Map<string, { skor: number; maks: number }>()
    ada.set(j.question_bank_item_id, { skor: j.score, maks: j.max })
    perSesi.set(j.session_id, ada)
    if (!jawabPertama.has(j.session_id)) jawabPertama.set(j.session_id, j.answered_at)
  }

  // Susunannya PER PAKET, bukan per pengerjaan. Sebelumnya tiap putaran punya
  // kartunya sendiri, dan topik yang dikerjakan sungguh-sungguh justru jadi
  // paling sulit dibaca: enam kartu untuk dua paket, masing-masing berisi
  // potongan soal yang berbeda-beda, tanpa satu tempat pun yang menjawab
  // "jadi Paket 1 sekarang bagaimana".
  //
  // Sekarang satu kartu satu paket. Petak bernomornya RANGKUMAN seluruh
  // putaran — keadaan sekarang dari kesepuluh soal itu — dan nomornya nomor
  // paket (1..10 yang tetap), bukan urutan di sebuah putaran yang isinya cuma
  // sisa soal yang masih salah. Putarannya turun jadi baris kecil di bawahnya:
  // ia menerangkan bagaimana keadaan itu tercapai, dan itu keterangan, bukan
  // pintu.
  const perPaket = new Map<number, { itemId: string; ord: number }[]>()
  for (const b of isi) {
    const ada = perPaket.get(b.nomorPaket) ?? []
    ada.push({ itemId: b.itemId, ord: b.ord })
    perPaket.set(b.nomorPaket, ada)
  }

  // Jawaban terakhir tiap soal, HANYA dari putaran yang selesai — dasar yang
  // sama dengan `practice_paket_state` (migrasi 134), supaya petak di sini dan
  // angka di kartu paket tidak pernah bercerita beda. Sesi yang ditinggalkan
  // tetap muncul sebagai baris putaran, tapi tidak mewarnai satu petak pun.
  const terakhir = new Map<string, { skor: number; maks: number; sesiId: string }>()
  for (const j of jawaban) {
    if (!sesi.get(j.session_id)?.finished_at) continue
    // `jawaban` urut dari yang terlama, jadi yang belakangan menimpa.
    terakhir.set(j.question_bank_item_id, {
      skor: j.score,
      maks: j.max,
      sesiId: j.session_id,
    })
  }

  // Putaran tiap paket, urut dari yang paling lama.
  const putaranPaket = new Map<
    number,
    { sesiId: string; mulai: string; selesai: boolean; benar: number; jumlah: number }[]
  >()
  for (const [sesiId, soal] of perSesi) {
    const s = sesi.get(sesiId)
    if (s?.paket_index == null) continue
    const daftar = [...soal.values()]
    const baris = {
      sesiId,
      mulai: s.started_at ?? jawabPertama.get(sesiId)!,
      selesai: !!s.finished_at,
      benar: daftar.filter(d => d.maks > 0 && d.skor >= d.maks).length,
      jumlah: daftar.length,
    }
    const ada = putaranPaket.get(s.paket_index) ?? []
    ada.push(baris)
    putaranPaket.set(s.paket_index, ada)
  }
  for (const daftar of putaranPaket.values()) {
    daftar.sort((a, b) => a.mulai.localeCompare(b.mulai))
  }

  // Sesi dari sebelum topik ini dibagi jadi paket. Tidak digambar sebagai
  // paket — ia memang bukan — tapi juga tidak dihapus dari layar diam-diam.
  const sebelumPaket = [...perSesi.keys()].filter(
    id => sesi.get(id) && sesi.get(id)!.paket_index == null
  ).length

  const kartuPaket = [...perPaket.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([nomor, soal]) => {
      const keadaan = paketTopik.find(p => p.nomor === nomor) ?? null
      const petak = [...soal]
        .sort((a, b) => a.ord - b.ord)
        .map(({ itemId, ord }) => {
          const t = terakhir.get(itemId)
          return {
            nomor: ord,
            hasil: hasilSoal(t?.skor ?? null, t?.maks ?? null, !!t),
            // Rute peninjauan ORANG TUA, bukan halaman hasil milik anaknya.
            // Yang terakhir cuma membuka kunci untuk paket yang sudah terkunci
            // — aturan yang benar untuk anak dan salah untuk orang tua, yang
            // sedang memeriksa pekerjaan lampau dan tidak boleh menutup paket
            // yang masih boleh dikerjakan.
            //
            // Soalnya ditunjuk dengan ID, bukan nomor: nomor punya arti berbeda
            // di paket dan di putaran, dan alamat yang artinya bergantung pada
            // konteks adalah alamat yang cepat atau lambat salah membuka.
            tautan: t
              ? `/keluarga/${studentId}/penguasaan/${groupId}/soal?sesi=${t.sesiId}&item=${itemId}`
              : null,
          }
        })
      const urut = [...soal].sort((a, b) => a.ord - b.ord)
      return {
        nomor,
        petak,
        total: soal.length,
        benar: petak.filter(p => p.hasil === 'benar').length,
        terkunci: keadaan?.terkunci ?? false,
        persen: keadaan && keadaan.maks > 0 ? persenDari(keadaan.skor, keadaan.maks) : null,
        putaran: (putaranPaket.get(nomor) ?? []).map(r => ({
          ...r,
          // Satu sel per soal PAKET, bukan per soal putaran ini. Putaran kedua
          // yang cuma memuat empat soal tetap punya sepuluh kolom, enam di
          // antaranya kosong — dan kekosongan itulah keterangannya: soal-soal
          // itu sudah benar, jadi tidak disodorkan lagi.
          sel: urut.map(({ itemId, ord }) => {
            const n = perSesi.get(r.sesiId)?.get(itemId)
            return {
              nomor: ord,
              hasil: n ? hasilSoal(n.skor, n.maks, true) : null,
            }
          }),
        })),
      }
    })

  // Nilai tiap soal dibagi bobot SELURUH soal topik (migrasi 129), dan sejak
  // migrasi 134 hanya dari putaran yang SELESAI — putaran yang ditinggalkan di
  // tengah tidak bernilai, jadi mengulang tidak pernah berisiko.
  const persen = k && k.max_available > 0 ? persenDari(k.score, k.max_available) : null
  const label = persen != null ? labelPenguasaan(rubrik, persen) : null

  // Kenaikannya dibaca antar-PAKET, bukan antara jawaban pertama dan terakhir
  // tiap soal. Sesudah nilainya jadi rata-rata paket, membandingkannya dengan
  // angka yang berpenyebut lain adalah dua ukuran yang dipaksa berdampingan.
  // Kenaikannya dibaca dari putaran PERTAMA tiap soal ke keadaan sekarang —
  // ukuran yang sama penyebutnya, tidak seperti membandingkan nilai dua putaran
  // yang jumlah soalnya berbeda.
  const awal =
    k && k.max_available > 0 && k.first_score !== k.score
      ? persenDari(k.first_score, k.max_available)
      : null
  const rincian = k
    ? {
        correct: k.correct,
        partial: k.partial,
        wrong: k.wrong,
        belum: Math.max(0, k.total - k.answered),
      }
    : null

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-kartu">
        <p className="text-xs text-gray-400">
          {[topik.subjects?.name, topik.grade_level, topik.theme].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight text-gray-900">{topik.topic}</p>

        {rincian ? (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-gray-900">
                {persen == null ? '—' : `${persen}%`}
              </span>
              {label && <span className="text-sm font-medium text-gray-500">{label}</span>}
            </div>
            {/* Keyakinan berdiri tepat di bawah angkanya, bukan di ujung
                kartu: ia mengubah arti angka itu, dan keterangan yang mengubah
                arti sesuatu harus terbaca sebelum pembacanya sempat
                menyimpulkan. */}
            <Keyakinan
              tuntas={k!.paket_tuntas}
              sempurna={k!.paket_sempurna}
              total={k!.paket_total}
              className="mt-1.5"
            />

            {awal != null && persen != null && (
              <p className="mt-3 text-sm text-gray-500">
                {awal < persen
                  ? `Naik dari ${awal}% saat soal-soalnya pertama dijawab.`
                  : `Saat pertama dijawab ${awal}%.`}
              </p>
            )}

            {/* Bilah ini menjawab pertanyaan yang LAIN dari persen di atasnya:
                bukan "seberapa baik ia mengerjakan paket", melainkan "berapa
                soal di topik ini yang sudah pernah dikuasai". Keduanya bisa
                berbeda jauh — sepuluh soal yang sama dikerjakan tiga kali
                memberi rata-rata paket yang tinggi sementara sebagian besar
                topiknya belum pernah disentuh — dan justru karena itu keduanya
                perlu ada. Judul kecilnya yang menjaga agar tidak terbaca
                sebagai dua versi dari angka yang sama. */}
            <p className="mt-4 text-xs font-medium text-gray-500">Cakupan soal topik ini</p>
            <BilahJawaban rincian={rincian} total={k!.total} className="mt-2" />
            <KeteranganJawaban rincian={rincian} className="mt-3" />
            <p className="mt-2 text-xs text-gray-400 tabular-nums">
              {k!.answered}/{k!.total} soal dikerjakan
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Belum ada latihan di topik ini.
          </p>
        )}
      </div>

      {kartuPaket.length > 0 && (
        <div className="space-y-2">
          <div className="px-1">
            <p className="font-semibold tracking-tight text-gray-900">Proses belajarnya</p>
          </div>

          {/* Satu kartu satu PAKET. Petaknya rangkuman seluruh putaran, dan
              hanya petak yang bisa diketuk — di baliknya ada satu soal, satu
              jawaban, satu pembahasan. Putarannya baris kecil tanpa tautan:
              "putaran ke-2 · 4 soal" tidak punya isi yang layak dibuka
              sendiri, dan menjadikannya pintu berarti empat pintu untuk satu
              paket yang semuanya bermuara ke tempat yang sama. */}
          {kartuPaket.map(p => (
            <div key={p.nomor} className="rounded-xl bg-white p-4 shadow-kartu">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">Paket {p.nomor}</span>
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

              {/* Baris ini BARIS KEPALA bagi riwayat putaran di bawahnya:
                  kisinya sama persis, jadi kolom keempat di sini dan kolom
                  keempat di tiap putaran menunjuk soal yang sama. Itulah yang
                  membuat petak putaran boleh tanpa angka — nomornya sudah
                  disebutkan sekali di sini, di puncak kolomnya.

                  Karena itu ia kisi, bukan deretan yang melipat. Deretan yang
                  melipat menaruh nomor 9 dan 10 di baris kedua, dan begitu itu
                  terjadi tidak ada lagi kolom yang bisa ditelusuri.

                  Soal yang belum pernah dijawab tidak punya tautan — tidak ada
                  jawaban maupun pembahasan untuk dibuka di baliknya. */}
              {/* Kisi lima kolom: sepuluh soal jadi tepat dua baris yang
                  memenuhi lebar kartu. Sebelumnya deretan 32px yang melipat
                  jadi 8 + 2, dan baris kedua yang cuma berisi dua petak dengan
                  ruang kosong panjang di kanannya terbaca seperti sisa, bukan
                  seperti separuh dari satu kesatuan.

                  Lima diturunkan dari ukuran paketnya, bukan ditulis sebagai
                  angka lepas: kalau satu paket suatu hari bukan sepuluh soal
                  lagi, barisnya ikut menyesuaikan sendiri.

                  Soal yang belum pernah dijawab tidak punya tautan — tidak ada
                  jawaban maupun pembahasan untuk dibuka di baliknya. */}
              <NomorJawaban
                soal={p.petak}
                tautan={n => p.petak.find(x => x.nomor === n)?.tautan ?? null}
                kolom={Math.ceil(SOAL_PER_PAKET / 2)}
                className="mt-3"
              />

              {p.putaran.length > 0 && (
                <ul className="mt-3 space-y-2.5 border-t border-gray-100 pt-2.5">
                  {p.putaran.map((r, i) => (
                    <li key={r.sesiId} className="flex items-center gap-3">
                      {/* Dua kolom: keterangannya di kiri, petaknya di kanan.
                          Sebelumnya keduanya bertumpuk, dan tiap putaran
                          menghabiskan dua baris — empat putaran jadi delapan
                          baris untuk satu paket. Berdampingan, tinggi barisnya
                          ditentukan yang paling tinggi di antara keduanya, dan
                          itu selalu kolom kiri yang memang cuma tiga baris
                          kecil. */}
                      {/* Tanpa "4/10 benar": titik-titik di sebelahnya SUDAH
                          mengatakannya, dan mengatakannya lagi dengan angka
                          membuat mata memilih mana yang dibaca — lalu memilih
                          angkanya, yang justru bentuk paling lambat untuk
                          pertanyaan "soal mana". Cacahnya tetap ada di kepala
                          kartu, satu kali, untuk paketnya secara keseluruhan. */}
                      {/* Tinggal namanya. Tanggal dan jamnya dilepas karena di
                          tabel ini yang dibaca URUTAN, bukan waktu: putaran
                          kedua datang sesudah yang pertama, dan itu sudah
                          dikatakan nomornya. Empat baris tanggal yang hampir
                          selalu berdekatan cuma menambah teks yang harus
                          dilewati untuk sampai ke titik-titiknya.

                          Kolomnya 4rem supaya sisa lebarnya jatuh ke titik.
                          Namanya ditebalkan: ia satu-satunya penanda baris di
                          sini, berdiri sendirian menghadapi sepuluh titik
                          berwarna di sebelahnya. */}
                      <div className="w-16 shrink-0 leading-snug">
                        <span className="block text-xs font-semibold text-gray-600">
                          Putaran {i + 1}
                        </span>
                        {!r.selesai && (
                          <span className="block text-[10px] text-gray-400">ditinggalkan</span>
                        )}
                      </div>

                      {/* Putaran yang DITINGGALKAN tidak menggambar apa pun.
                          Nilainya memang tidak disimpan (migrasi 134), jadi
                          petak hijau di sana akan mengabarkan benar yang tidak
                          ikut dihitung — kabar yang lebih buruk daripada
                          barisnya kosong. */}
                      {r.selesai && (
                        <div
                          role="img"
                          aria-label={`Putaran ${i + 1}, benar di soal ${
                            r.sel
                              .filter(x => x.hasil === 'benar')
                              .map(x => x.nomor)
                              .join(', ') || 'tidak ada'
                          }`}
                          className="grid w-full min-w-0 max-w-[17rem] gap-1"
                          // Kolomnya melar mengisi sisa lebar kartu, dengan
                          // batas atas supaya di layar lebar titiknya tidak
                          // membesar jadi tombol yang tidak bisa ditekan.
                          //
                          // Jumlah kolomnya tetap sebanyak paket penuh meski
                          // paketnya lebih kecil: itu yang menjaga kolom ketiga
                          // tetap kolom ketiga di semua putaran, dan yang
                          // membuat riwayat ini bisa dibaca menurun.
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(
                              p.total,
                              SOAL_PER_PAKET
                            )}, minmax(0, 1fr))`,
                          }}
                        >
                          {r.sel.map(sel =>
                            sel.hasil ? (
                              <TitikHasil key={sel.nomor} nomor={sel.nomor} hasil={sel.hasil} />
                            ) : (
                              // Kolomnya tetap ada meski kosong — itu yang
                              // menjaga nomor 3 tetap di kolom ketiga di semua
                              // putaran.
                              <span key={sel.nomor} className="aspect-square w-full" />
                            )
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {sebelumPaket > 0 && (
            <p className="px-1 pt-1 text-xs text-gray-400">
              Ada {sebelumPaket} latihan lama dari sebelum topik ini dibagi jadi paket. Jawabannya
              tetap dihitung, tapi tidak punya paket untuk ditempatkan.
            </p>
          )}
        </div>
      )}

      <Link
        href={`/belajar?anak=${studentId}&topik=${groupId}`}
        className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Buka Topik Ini di Latihan
      </Link>
    </div>
  )
}
