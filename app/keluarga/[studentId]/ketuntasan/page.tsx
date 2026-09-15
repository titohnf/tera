import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak } from '@/lib/belajar/sesi'
import { kemajuanTopikPeta } from '@/lib/belajar/topik-rapor'
import { namaTema } from '@/lib/belajar/tema-topik'
import KartuPenguasaan from '@/components/keluarga/KartuPenguasaan'

/** Bagian paket yang tuntas, 0–1. Topik tanpa paket dikirim ke ujung daftar. */
function rasioTuntas({ tuntas, total }: { tuntas: number; total: number }) {
  return total > 0 ? tuntas / total : 2
}

/**
 * Ketuntasan Materi: peta kompetensi seorang anak — paket latihan bertingkat
 * yang mengukur penguasaan per topik.
 *
 * Bagian ini DULU ruang "Misi" di dalam tab Kompetensi (`/penguasaan`). Ia
 * dipindahkan ke tabnya sendiri karena isinya dijamin TERPISAH dari daftar
 * topik kurikulum: trigger migrasi 148 melarang butir ber-`topik_id` punya tag
 * kurikulum, jadi butir yang dihitung di sini tidak pernah sama dengan yang
 * dihitung di tab Kompetensi, dan penyebut paketnya pun berbeda — di sini paket
 * latihan DI DALAM cakupan Bloom tiap topik saja (migrasi 189), sementara paket
 * ujian dan paket pengayaan dilaporkan terpisah di dalam tiap topik.
 *
 * Menaruh dua penyebut berbeda di bawah satu layar hanya membingungkan; satu
 * tab per penyebut membuat batasnya tertulis di bilah ini, bukan tersirat.
 *
 * Tab yang terpisah ternyata belum cukup. Selama halaman ini masih menyorot
 * PERSEN seperti tab Kompetensi — kartu yang sama, angka besar yang sama, pita
 * "Baik"/"Istimewa" yang sama — orang tua tetap melihat dua persen yang tampak
 * sebanding untuk anak yang sama, dan tidak ada apa pun di layar yang
 * menyebutkan bahwa penyebutnya berlainan. Sekarang halaman ini menyorot yang
 * memang jadi pertanyaan pendekatan berjenjang: BERAPA PAKET YANG SUDAH
 * TUNTAS. Tidak ada persen di daftar ini, jadi tidak ada yang bisa tertukar;
 * persen penguasaannya tetap terbaca satu ketukan lebih dalam, di kepala
 * halaman rincian tiap topik.
 *
 * Karena persennya tidak lagi digambar, rubrik pita tidak lagi dibaca di sini —
 * dan bersamanya hilang satu panggilan `mastery_rubric_for` per mapel setiap
 * halaman ini dibuka.
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

  const baris = misiDikerjakan
    .map(k => ({
      kunci: k.topikId,
      nama: k.nama,
      elemen: k.elemen,
      // Tema di depan, urutan yang sama dengan baris peta di Misi: yang
      // pertama menjawab "ini tentang apa", sisanya menjawab "yang mana".
      keterangan: [namaTema(k.elemen), k.jenjangKelas && `Kelas ${k.jenjangKelas}`, k.topikId]
        .filter(Boolean)
        .join(' · '),
      sorotan: {
        jenis: 'ketuntasan' as const,
        tuntas: k.paketTuntas,
        total: k.paketTotal,
      },
    }))
    // Yang paling sedikit tuntas di atas — janji yang sama dengan tab
    // Kompetensi, tapi diukur dengan angka yang MEMANG TERBACA di kartunya.
    // Mengurutkan menurut persen yang tidak lagi ditampilkan berarti urutan
    // yang tidak bisa dijelaskan kepada yang membacanya. Topik tanpa paket
    // turun ke bawah: ia tidak punya rasio, dan nol bukan jawaban yang jujur
    // untuk penyebut yang kosong.
    .sort(
      (a, b) =>
        rasioTuntas(a.sorotan) - rasioTuntas(b.sorotan) || a.nama.localeCompare(b.nama, 'id'),
    )

  return (
    <div className="space-y-6">

      {/* Judul dan panah kembalinya ada di bilah atas (`HeaderKeluarga`). */}
      <p className="text-sm leading-relaxed text-gray-500">
        Berapa banyak paket latihan tiap topik peta kompetensi yang sudah
        dituntaskan. Ketuk sebuah topik untuk melihat rinciannya.
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
          {/* Tidak ada kartu ringkasan di sini. "N dari M topik tuntas" sudah
              diucapkan kartu Ketuntasan Materi di `/rapor`, layar yang dilewati
              setiap orang yang sampai ke sini. Halaman ini daftarnya; yang
              merangkum adalah pintu masuknya. Banyaknya topik tetap terbaca di
              ujung kanan judul seksi di bawah. */}
          {/* Nama seksinya TIDAK diulang: sejak bilah tab diganti kartu,
              `HeaderKeluarga` sudah mencetak "Ketuntasan Materi" di puncak
              layar, dan judul yang sama dua kali dalam satu layar cuma memakan
              baris. Yang tersisa cuma cacahnya. */}
          <p className="px-1 text-right text-xs text-gray-400">{baris.length} topik</p>
          <p className="px-1 text-xs leading-relaxed text-gray-400">
            Peta kompetensi Matematika: paket latihan bertingkat yang mengukur
            penguasaan per topik, sebatas yang diminta dari tiap topik. Paket
            ujian dan paket pengayaannya dilaporkan terpisah di dalam tiap topik.
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