import Link from 'next/link'
import { belajarContext } from '@/lib/belajar/konteks'
import { keadaanPaketTopik, petaTopik } from '@/lib/belajar/topik-peta'
import { langkahTopik } from '@/lib/belajar/langkah'
import { namaPaket } from '@/lib/belajar/nama-paket'
import { namaTema } from '@/lib/belajar/tema-topik'
import { labelSesiWib } from '@/lib/waktu'
import { todayWib } from '@/lib/daily-message'
import DaftarPaket from '@/components/belajar/DaftarPaket'
import IkonTema from '@/components/belajar/IkonTema'
import TombolLangkah from '@/components/belajar/TombolLangkah'

/**
 * Halaman satu topik Misi: kamu sampai di mana, dan berikutnya apa.
 *
 * LAYAR PERSIMPANGAN, BUKAN LAYAR ANTARA. Selama langkahnya masih paket
 * latihan, barisnya di peta membuka soalnya langsung — kunjungan pertama,
 * lanjutan, maupun pengulangan paket yang belum lolos ambang. Halaman yang cuma
 * berkata "kamu akan mengerjakan Paket C2" adalah ketukan yang tidak membayar
 * dirinya sendiri, dan itu berlaku untuk ketiganya.
 *
 * Yang membawa anak ke sini cuma satu keadaan: paket wajib terakhir lolos, dan
 * langkahnya berpindah ke ujian. Di situ ada dua hal yang tidak dipunyai
 * satu pun langkah sebelumnya — sebuah PILIHAN (ambil pengayaan dulu, atau
 * ujian sekarang) dan sebuah AKIBAT YANG TIDAK BISA DIBATALKAN (sampel ujian
 * lahir sekali, tanpa putaran kedua). Keduanya pantas dibaca sebelum diketuk.
 *
 * Selebihnya halaman ini tetap bisa dibuka kapan saja lewat "Pilih Paket Lain"
 * dan tautan langsung, jadi seluruh keadaan lain — langkah latihan, terkunci,
 * topik yang sudah habis — tetap punya tampilannya di bawah. Yang berubah cuma
 * siapa yang diantar ke sini, bukan apa yang ia temukan kalau datang sendiri.
 *
 * RUMAH BARU DAFTAR PAKET. Sampai sebelum 190 daftarnya membentang di dalam
 * kartu peta; sekarang ia tinggal di sini saja. Satu daftar di dua layar berarti
 * dua tempat yang harus diingat bersamaan setiap kali aturan paket berubah, dan
 * yang terlupa selalu yang jarang dibuka.
 *
 * MEMBUAT BARIS `learners`, seperti halaman peta di atasnya, dan dengan alasan
 * yang sama: ini permukaan tempat latihan DIMULAI. `belajarContext` pula yang
 * memeriksa anak ini benar milik keluarga yang sedang masuk.
 */
export default async function TopikMisiPage({
  params,
}: {
  params: Promise<{ studentId: string; topikId: string }>
}) {
  const { studentId, topikId } = await params
  const { learnerId } = await belajarContext(studentId)

  const [peta, langkah, paket] = await Promise.all([
    petaTopik(learnerId),
    langkahTopik(learnerId, topikId),
    keadaanPaketTopik(learnerId, topikId),
  ])

  const t = peta.find(x => x.id === topikId)

  if (!t) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-white p-6 text-sm leading-relaxed text-gray-500 shadow-kartu">
          Topik ini tidak ada di peta kompetensimu, atau belum dibuka.
        </p>
        <Link
          href={`/keluarga/${studentId}/misi`}
          className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-kartu transition hover:bg-slate-100"
        >
          Kembali ke Misi
        </Link>
      </div>
    )
  }

  // Kemajuannya dibaca dari LANGKAHNYA, bukan dihitung ulang di sini. Paket
  // wajib yang berdiri sebelum langkah berikutnya adalah paket yang sudah
  // lolos — definisi yang persis sama dengan yang dipakai database memilih
  // langkah itu, dan satu-satunya cara memastikan titik-titik di layar ini
  // tidak pernah bercerita beda dengan tombol di bawahnya.
  const wajib = paket.filter(p => p.jenis === 'latihan' && !p.pengayaan)
  const indeks = langkah?.paketId ? wajib.findIndex(p => p.paketId === langkah.paketId) : -1
  const lolos = indeks === -1 ? wajib.length : indeks

  const namaLangkah = langkah?.paketId
    ? namaPaket({
        jenis: langkah.jenis === 'ujian' ? 'ujian' : 'latihan',
        levelBloom: langkah.levelBloom,
        nomor: langkah.levelBloom ?? 1,
      })
    : null

  // Topik ini punya paket pengayaan atau tidak. Menentukan apakah kartu ujian
  // di bawah boleh menawarkannya sebagai pilihan — menawarkan sesuatu yang
  // tidak ada adalah cara tercepat membuat anak menggulir mencari yang tidak
  // pernah ada.
  const adaPengayaan = paket.some(p => p.pengayaan)

  const bukaPada = langkah?.bukaPada
    ? (() => {
        const l = labelSesiWib(langkah.bukaPada!, todayWib())
        const hari = l.hari === l.tanggal ? l.hari : l.hari.toLowerCase()
        return `${hari} pukul ${l.jam}`
      })()
    : null

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-kartu">
        <div className="flex items-start gap-3">
          <IkonTema elemen={t.elemen} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">
              {[namaTema(t.elemen), t.jenjangKelas && `Kelas ${t.jenjangKelas}`, t.id]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-gray-900">
              {t.nama}
            </p>
          </div>
        </div>

        {/* Titik, bukan persentase. Yang ditanyakan anak di layar ini "berapa
            lagi", dan tiga titik menjawabnya dalam sekali lihat tanpa
            menyeberangkan satu pun angka penilaian ke layarnya (FR3). */}
        {wajib.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="flex gap-1" aria-hidden>
              {wajib.map((p, i) => (
                <span
                  key={p.paketId}
                  className={`h-2 w-2 rounded-full ${
                    i < lolos ? 'bg-emerald-500' : i === lolos ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </span>
            <span className="text-xs text-gray-500">
              {lolos} dari {wajib.length} paket wajib tuntas
            </span>
          </div>
        )}
      </div>

      {/* Langkah berikutnya, dan tidak ada yang lain di kartu ini. Ini
          satu-satunya pertanyaan yang membawa anak ke halaman ini. */}
      {namaLangkah && langkah && !langkah.terkunci && (
        <div className="rounded-xl bg-white p-5 shadow-kartu">
          {/* "Rekomendasi", bukan cuma "Berikutnya". Yang kedua berbunyi
              seperti antrean yang sudah ditetapkan, padahal daftar di bawah
              memang boleh dikerjakan dalam urutan mana saja — dan anak yang
              membacanya sebagai perintah akan mengira paket lain terlarang.
              Kata "rekomendasi" mengatakan hal yang sebenarnya: ini saran
              sistem, bukan pagar. */}
          <p className="text-xs text-gray-400">Rekomendasi Berikutnya</p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-gray-900">
            {namaLangkah}
          </p>
          {langkah.pernahDikerjakan && langkah.jenis !== 'ujian' && (
            // KESIMPULAN, BUKAN ANGKA. Yang membuat paket ini muncul lagi
            // adalah Skor Putaran 1 yang belum melewati ambang — angka yang
            // FR3 larang ditampilkan ke murid. Yang disampaikan cuma apa yang
            // perlu ia lakukan, dan kalimatnya tidak menyebut kegagalan:
            // corrective loop adalah inti mastery learning, bukan hukumannya.
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Nilainya belum sampai batas tuntas. Perbaiki soal yang masih salah
              — yang dihitung nilai terakhirmu, jadi memperbaikinya benar-benar
              terhitung.
            </p>
          )}
          {langkah.jenis === 'ujian' && (
            // Ujian disebutkan APA ADANYA sebelum dibuka, dan ini
            // satu-satunya tempat yang bisa menyebutkannya: sekali ditekan,
            // sampelnya lahir dan tidak ada putaran kedua (189). Anak yang
            // mengetuk tanpa tahu itu kehilangan sesuatu yang tidak bisa
            // dikembalikan.
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Semua paket latihanmu sudah tuntas. Ujian ini mencampur soal dari
              seluruh level dan hanya dikerjakan sekali — tidak ada putaran kedua.
            </p>
          )}
          {langkah.jenis === 'ujian' && adaPengayaan && (
            // CABANGNYA DISEBUT, bukan cuma disediakan. Paket pengayaan memang
            // sudah berdiri di daftar bawah dengan judul kelompoknya sendiri,
            // tapi anak yang membaca kartu "Berikutnya: Ujian Topik" lalu
            // melihat tombol besar di bawahnya tidak punya alasan menggulir
            // lebih jauh. Satu kalimat di sini yang mengubah layar ini dari
            // pengumuman jadi persimpangan.
            //
            // Urutannya sengaja: ujian disebut lebih dulu sebagai langkah
            // resmi, pengayaan sebagai tawaran. Membalikkannya membuat yang
            // tidak wajib terbaca seperti syarat.
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Kalau mau, paket pengayaan di bawah boleh kamu ambil dulu — tidak
              wajib, dan ujiannya tetap menunggu sampai kamu siap.
            </p>
          )}
          <div className="mt-3">
            <TombolLangkah
              anak={studentId}
              topikId={topikId}
              label={
                langkah.jenis === 'ujian'
                  ? 'Mulai Ujian Topik'
                  : langkah.pernahDikerjakan
                    ? `Ulangi — ${namaLangkah}`
                    : langkah.sudahMulai
                      ? `Lanjut — ${namaLangkah}`
                      : `Mulai — ${namaLangkah}`
              }
            />
          </div>
        </div>
      )}

      {/* Terkunci: kuncinya sudah dibuka, jadi paketnya menunggu jedanya habis.
          KAPAN-nya disebutkan — baris mati tanpa satu kata pun tentang kapan ia
          hidup lagi adalah yang membuat anak mengira topiknya habis. */}
      {namaLangkah && langkah?.terkunci && (
        <div className="rounded-xl bg-white p-5 shadow-kartu">
          {/* "Rekomendasi", bukan cuma "Berikutnya". Yang kedua berbunyi
              seperti antrean yang sudah ditetapkan, padahal daftar di bawah
              memang boleh dikerjakan dalam urutan mana saja — dan anak yang
              membacanya sebagai perintah akan mengira paket lain terlarang.
              Kata "rekomendasi" mengatakan hal yang sebenarnya: ini saran
              sistem, bukan pagar. */}
          <p className="text-xs text-gray-400">Rekomendasi Berikutnya</p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-gray-900">
            {namaLangkah}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {bukaPada
              ? `Kunci jawabannya sudah dibuka, jadi paket ini bisa dikerjakan lagi ${bukaPada}.`
              : 'Kunci jawabannya sudah dibuka, jadi paket ini tidak dikerjakan lagi.'}{' '}
            Sementara itu kamu boleh mengambil paket lain di bawah.
          </p>
        </div>
      )}

      {/* Keadaan "benar semua tapi belum tuntas" sudah TIDAK ADA sejak 192.
          Ketuntasan memakai nilai akhir, jadi paket yang seluruh soalnya benar
          otomatis lolos dan langkahnya pindah sendiri. Kartu penjelasannya
          ikut dihapus bersama keadaan yang dijelaskannya. */}
      {!namaLangkah && (
        <div className="rounded-xl bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">Topik ini sudah selesai</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">
            Semua paket wajibnya tuntas dan ujiannya sudah kamu kerjakan. Paket
            pengayaan di bawah tetap terbuka kalau kamu mau melangkah lebih jauh.
          </p>
        </div>
      )}

      {/* Judulnya saja, tanpa kalimat keterangan di bawahnya. "Boleh dikerjakan
          tidak harus urut" dulu berdiri di sini; yang menyampaikannya sekarang
          kartunya sendiri, yang masing-masing menyebut apa ia wajib atau
          pengayaan dan mana yang bisa diketuk. Judulnya sendiri tetap perlu:
          ia yang memisahkan daftar ini dari kartu langkah berikutnya di
          atasnya, dua hal yang tanpa batas terbaca sebagai satu tumpukan. */}
      <div className="space-y-2 pt-2">
        <p className="px-1 font-semibold tracking-tight text-gray-900">Daftar Paket</p>
        <DaftarPaket
          anak={studentId}
          sumber={{ jenis: 'peta', topikId }}
          jumlahSoal={t.jumlahPaket * 8}
          awal={paket}
          hariIniWib={todayWib()}
        />
      </div>
    </div>
  )
}
