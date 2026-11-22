import PemilihMapel from '@/components/belajar/PemilihMapel'
import { kemajuanTopikPeta } from '@/lib/belajar/topik-rapor'
import { daftarMapelPeta, MAPEL_AWAL, mapelTopik, namaMapelPerId } from '@/lib/belajar/mapel-peta'
import { kesetaraanLengkap } from '@/lib/reports/kesetaraan-kelas'
import { ketuntasanPerMapel, type RangkumanKetuntasan } from '@/lib/reports/ringkasan-laporan'
import TanggaKetuntasan from '@/components/keluarga/TanggaKetuntasan'
import { namaTema } from '@/lib/belajar/tema-topik'
import KartuPenguasaan, { type TujuanRincian } from '@/components/keluarga/KartuPenguasaan'

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
 *
 * Dipakai dua tempat dengan isi yang sama persis: halaman anak di portal
 * keluarga dan menu Misi di panel admin. `rincian` mematikan tautan ke halaman
 * rincian tiap topik — rutenya milik portal keluarga dan tertutup bagi admin.
 */
export default async function IsiKetuntasan({
  studentId,
  learnerId,
  rincian = true,
  pilihMapel,
}: {
  studentId: string
  /** Null kalau siswa belum pernah punya baris `learners`. */
  learnerId: string | null
  rincian?: boolean | TujuanRincian
  /**
   * Menampilkan satu mapel saja, dengan pemilih mapel bila ada lebih dari satu. Tanpa ini seluruh peta
   * tampil seperti semula (dipakai panel admin). Mapel berbagi peta yang sama tetapi tidak boleh
   * tercampur di satu daftar. `dipilih` yang tidak dikenal jatuh ke mapel pertama (Matematika dulu).
   */
  pilihMapel?: { dipilih?: string; alamat: (mapel: string) => string }
}) {
  const misi = learnerId ? await kemajuanTopikPeta(learnerId) : []
  const namaMapel = await namaMapelPerId()
  const daftarMapel = daftarMapelPeta(misi ?? [], namaMapel)
  const mapel = pilihMapel
    ? pilihMapel.dipilih && daftarMapel.includes(pilihMapel.dipilih)
      ? pilihMapel.dipilih
      : (daftarMapel[0] ?? MAPEL_AWAL)
    : undefined
  const misiMapel = mapel ? (misi ?? []).filter(k => mapelTopik(k, namaMapel) === mapel) : (misi ?? [])
  const misiDikerjakan = misiMapel.filter(k => k.answered > 0)

  // Tangga kelas hanya untuk halaman satu mapel. Aturan resmi (kumulatif dari kelas 1) baru
  // berlaku untuk Matematika, jadi pembacaan kesetaraannya yang berat hanya dilakukan untuk itu.
  let rangkuman: RangkumanKetuntasan | null = null
  if (mapel && misi) {
    const { ks, tangga } = mapel === MAPEL_AWAL && learnerId ? await kesetaraanLengkap(learnerId) : { ks: null, tangga: null }
    rangkuman = ketuntasanPerMapel(misi, namaMapel, ks, tangga).find(k => k.mapel === mapel) ?? null
  }

  const baris: BarisMisi[] = misiDikerjakan
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
    <TampilanKetuntasan
      baris={baris}
      gagal={misi === null}
      studentId={studentId}
      rincian={rincian}
      mapel={mapel ?? MAPEL_AWAL}
      pilihan={pilihMapel && daftarMapel.length > 1 ? daftarMapel.map(m => ({ nama: m, href: pilihMapel.alamat(m), aktif: m === mapel })) : null}
      rangkuman={rangkuman && rangkuman.dikerjakan > 0 ? rangkuman : null}
    />
  )
}

/** Satu baris topik peta kompetensi yang sudah siap digambar. */
export type BarisMisi = {
  kunci: string
  nama: string
  elemen: string
  keterangan: string
  sorotan: { jenis: 'ketuntasan'; tuntas: number; total: number }
}

/**
 * Tampilan murni dari daftar ketuntasan: tidak membaca apa pun dari database.
 * Dipisah supaya rupanya bisa dilihat tanpa data sungguhan.
 */
export function TampilanKetuntasan({
  baris,
  gagal,
  studentId,
  rincian,
  mapel,
  pilihan,
  rangkuman,
}: {
  baris: BarisMisi[]
  /** Kueri ketuntasannya gagal — beda dengan "belum ada yang dikerjakan". */
  gagal: boolean
  studentId: string
  rincian: boolean | TujuanRincian
  /** Mapel yang sedang tampil. */
  mapel: string
  /** Pemilih mapel; null bila tidak perlu (satu mapel, atau halaman tidak memilih). */
  pilihan: { nama: string; href: string; aktif: boolean }[] | null
  /** Posisi dan tangga kelas mapel ini; null bila belum ada yang dikerjakan. */
  rangkuman: RangkumanKetuntasan | null
}) {

  return (
    <div className="space-y-6">
      <div className="-mt-2">
        <PemilihMapel pilihan={pilihan} />
      </div>

      {rangkuman && (
        <section className="rounded-xl bg-white p-4 shadow-kartu sm:p-5">
          <p className="mb-3 text-base font-semibold tracking-tight text-gray-900">Posisi di {mapel}</p>
          <TanggaKetuntasan k={rangkuman} />
        </section>
      )}

      {/* Judul dan panah kembalinya ada di bilah atas (`HeaderKeluarga`). */}
      <p className="text-sm leading-relaxed text-gray-500">
        Berapa banyak paket latihan tiap topik peta kompetensi yang sudah
        dituntaskan.{rincian && ' Ketuk sebuah topik untuk melihat rinciannya.'}
      </p>

      {gagal ? (
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
          <p className="px-1 text-right text-xs text-gray-400">{baris.length} Topik</p>
          <p className="px-1 text-xs leading-relaxed text-gray-400">
            Peta kompetensi {mapel}: paket latihan bertingkat yang mengukur
            penguasaan per topik, sebatas yang diminta dari tiap topik. Paket
            ujian dan paket pengayaannya dilaporkan terpisah di dalam tiap topik.
          </p>
          <ul className="space-y-3">
            {baris.map(b => (
              <KartuPenguasaan key={b.kunci} b={b} studentId={studentId} rincian={rincian} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
