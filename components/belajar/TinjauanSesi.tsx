import type { SoalTinjauan } from '@/lib/belajar/sesi'
import { bacaJawaban, bacaKunci, type BarisJawaban } from '@/lib/belajar/jawaban'
import { angkaSkor } from '@/lib/belajar/penilaian'
import { hasilSoal, PetakNomor, type HasilSoal } from './BilahJawaban'
import IsiSoal from './IsiSoal'
import RumusTeks from './RumusTeks'

/**
 * Daftar soal sebuah sesi, nomor per nomor: soalnya, jawaban anaknya, kuncinya,
 * pembahasannya.
 *
 * Ini ujung dari rantai yang dimulai di petak bernomor rincian topik. Petak itu
 * bisa berkata "nomor 4, 7, dan 9 salah" dan berhenti di situ, dan nomor tanpa
 * soalnya cuma memindahkan pertanyaan alih-alih menjawabnya. Di sinilah nomor
 * itu punya isi — dan nomornya sengaja nomor yang sama, undian sesi, supaya
 * keduanya bisa dicocokkan tanpa menghitung ulang.
 *
 * TERBUKA SEMUA, bukan daftar yang harus diketuk satu per satu. Yang dicari
 * pembacanya adalah soal yang salah, dan sepuluh baris tertutup menyuruhnya
 * membuka satu per satu untuk menemukan yang mana. Nomornya juga jadi jangkar
 * (`#soal-4`), jadi tautan dari luar bisa mendarat tepat di soalnya.
 *
 * Kunci jawabannya cuma muncul untuk soal yang BELUM penuh nilainya. Untuk soal
 * yang sudah benar ia cuma mengulang jawaban yang persis di atasnya.
 */
export default function TinjauanSesi({
  soal,
  nama,
  kunciTampil = true,
}: {
  soal: SoalTinjauan[]
  /** Nama anaknya, untuk menamai jawabannya sendiri. */
  nama: string
  /**
   * Kunci jawaban dan pembahasannya ikut ditampilkan.
   *
   * False untuk paket yang BELUM terkunci. Yang tersisa tetap berguna — soalnya,
   * jawaban anaknya, dan benar atau tidaknya — dan itu justru yang dicari orang
   * tua; yang ditahan cuma jawaban yang benar. Portal keluarga dibuka dengan
   * akun yang sama dengan yang dipakai anaknya berlatih, jadi kunci yang bebas
   * dibaca di sini membatalkan seluruh taruhan di sisi sana: tidak ada gunanya
   * tombol "Lihat Kunci Jawaban" menutup paket kalau kuncinya bisa diambil dari
   * layar sebelah tanpa membayar apa pun.
   */
  kunciTampil?: boolean
}) {
  if (soal.length === 0) return null

  return (
    <div className="space-y-2">
      {soal.map(s => {
        const maks = s.skorMaks ?? 0
        const skor = s.skor ?? 0
        const hasil = hasilSoal(s.skor, s.skorMaks, s.sudahDijawab)

        const jawaban = bacaJawaban(s, s.jawaban)
        const kunci = kunciTampil ? bacaKunci(s, s.kunci) : null

        return (
          <article
            key={s.id}
            id={`soal-${s.nomor}`}
            // Jangkarnya mendarat di bawah bilah kepala yang menempel, bukan di
            // belakangnya.
            className="scroll-mt-20 rounded-xl bg-white p-4 shadow-kartu"
          >
            <div className="flex items-center gap-2">
              <PetakNomor nomor={s.nomor} hasil={hasil} />
              <p className={`text-sm font-semibold ${NADA[hasil].judul}`}>
                {hasil === 'sebagian'
                  ? `Sebagian benar — ${angkaSkor(skor)} dari ${angkaSkor(maks)}`
                  : JUDUL[hasil]}
              </p>
            </div>

            {/* `fill_blank` tidak pernah menampilkan promptnya utuh saat
                dikerjakan — rumpangnya diganti kotak isian. Di sini ia dicetak
                apa adanya, garis bawahnya jadi tempat kosong yang isinya
                disebutkan di bawah, berurut nomor. */}
            <IsiSoal text={s.prompt} className="mt-3 text-[15px] leading-relaxed text-gray-900" />

            {!kunciTampil && (
              <p className="mt-3 text-xs text-gray-400">
                Kunci jawabannya belum dibuka — paket ini masih bisa dikerjakan lagi.
              </p>
            )}

            <div className="mt-3 space-y-2">
              {jawaban && kunci && sejajar(jawaban, kunci) ? (
                <Perbandingan jawaban={jawaban} kunci={kunci} />
              ) : (
                <>
                  {jawaban ? (
                    <Jawaban judul={`Jawaban ${nama}`} baris={jawaban} nada={NADA[hasil]} />
                  ) : (
                    <p className="text-sm text-gray-400">Soal ini dilewati.</p>
                  )}
                  {hasil !== 'benar' && kunci && (
                    <Jawaban judul="Jawaban benar" baris={kunci} nada={NADA.benar} />
                  )}
                </>
              )}
            </div>

            {/* Pembahasan ikut ditahan, bukan cuma kuncinya: hampir setiap
                pembahasan menyebutkan jawabannya di kalimat terakhir, jadi
                menahan kunci sambil membiarkan pembahasan cuma memindahkan
                kebocorannya ke tempat yang lebih panjang. */}
            {kunciTampil && s.pembahasan && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-gray-500">Pembahasan</p>
                <IsiSoal
                  text={s.pembahasan}
                  className="mt-1 text-sm leading-relaxed text-gray-700"
                />
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

/**
 * Warna tiap keadaan. Sekeluarga dengan umpan balik yang dilihat anaknya saat
 * mengerjakan (`PelariSesi`) — layar ini menceritakan ulang momen itu, jadi
 * warnanya tidak boleh jadi bahasa kedua.
 */
const NADA = {
  benar: { judul: 'text-emerald-700', bingkai: 'bg-emerald-50 ring-emerald-100' },
  sebagian: { judul: 'text-amber-700', bingkai: 'bg-amber-50 ring-amber-100' },
  salah: { judul: 'text-rose-700', bingkai: 'bg-rose-50 ring-rose-100' },
  belum: { judul: 'text-gray-500', bingkai: 'bg-gray-50 ring-gray-100' },
} as const

const JUDUL: Record<HasilSoal, string> = {
  benar: 'Benar',
  sebagian: 'Sebagian benar',
  salah: 'Belum tepat',
  belum: 'Belum dijawab',
}

/**
 * Dua daftar yang barisnya berpasangan satu-satu: kisi pernyataan, menjodohkan,
 * mengurutkan, isian rumpang. Semuanya lahir dari `options` yang sama, jadi
 * baris ke-i di jawaban dan di kunci selalu bicara tentang hal yang sama.
 */
function sejajar(jawaban: BarisJawaban[], kunci: BarisJawaban[]): boolean {
  return (
    jawaban.length === kunci.length &&
    jawaban.length > 0 &&
    jawaban.every((b, i) => b.label !== undefined && b.label === kunci[i].label)
  )
}

/**
 * Jawaban dan kunci dalam SATU daftar, baris demi baris.
 *
 * Dua kotak bertumpuk sudah dicoba dan gagal justru di soal yang paling
 * membutuhkannya: kisi tujuh pernyataan mencetak ketujuh pernyataan itu dua
 * kali, dan untuk tahu baris mana yang meleset pembacanya harus menggulung
 * bolak-balik antara dua daftar yang bunyinya sama persis. Yang dibandingkan
 * cuma satu kolom tipis di kanan — jadi kolom itulah yang didekatkan, dan
 * pernyataannya cukup ditulis sekali.
 *
 * Baris yang sudah cocok tidak menyebutkan kuncinya: mengulang jawaban yang
 * persis di sebelahnya membuat baris yang benar tampak sepadat baris yang
 * salah, padahal yang dicari mata pembacanya justru yang salah.
 */
function Perbandingan({
  jawaban,
  kunci,
}: {
  jawaban: BarisJawaban[]
  kunci: BarisJawaban[]
}) {
  return (
    <ul className="divide-y divide-gray-100 rounded-lg ring-1 ring-gray-100">
      {jawaban.map((b, i) => {
        const cocok = b.teks === kunci[i].teks
        return (
          <li key={i} className="p-3">
            <p className="text-sm text-gray-800">
              <RumusTeks text={b.label ?? ''} />
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
              <span className={cocok ? 'text-emerald-700' : 'text-rose-700'}>
                <span className="text-xs text-gray-400">Dijawab </span>
                <span className="font-semibold">
                  <RumusTeks text={b.teks} />
                </span>
              </span>
              {!cocok && (
                <span className="text-emerald-700">
                  {/* "Kunci", bukan "Benar": setengah dari soal berbaris
                      menjawab dengan kata "Benar" juga, dan "Benar Benar"
                      adalah label yang menelan nilainya sendiri. */}
                  <span className="text-xs text-gray-400">Kunci </span>
                  <span className="font-semibold">
                    <RumusTeks text={kunci[i].teks} />
                  </span>
                </span>
              )}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Satu jawaban: judulnya, lalu barisnya. Baris berlabel dicetak dua kolom —
 * pernyataan dan keputusannya, ruas kiri dan pasangannya — karena yang
 * dilakukan pembacanya adalah membandingkan baris demi baris dengan daftar di
 * sebelahnya.
 */
function Jawaban({
  judul,
  baris,
  nada,
}: {
  judul: string
  baris: BarisJawaban[]
  nada: { judul: string; bingkai: string }
}) {
  return (
    <div className={`rounded-lg p-3 ring-1 ${nada.bingkai}`}>
      <p className={`text-xs font-semibold ${nada.judul}`}>{judul}</p>
      <ul className="mt-1 space-y-1">
        {baris.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-800">
            {b.label && (
              <span className="min-w-0 flex-1 text-gray-500">
                <RumusTeks text={b.label} />
              </span>
            )}
            <span className={b.label ? 'min-w-0 flex-1 font-medium' : 'min-w-0 font-medium'}>
              <RumusTeks text={b.teks} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

