import Link from 'next/link'
import { BilahKemajuan } from '@/components/belajar/BilahJawaban'
import IkonTema from '@/components/belajar/IkonTema'

/**
 * Apa yang disorot sebuah baris — dan dengan begitu, PERTANYAAN apa yang
 * dijawab tabnya.
 *
 * Ini yang dulu tidak ada, dan ketiadaannya yang membuat dua tab rapor terlihat
 * kembar. Latihan Mandiri dan Ketuntasan Materi mengukur hal yang berbeda
 * dengan PENYEBUT yang berbeda — bab kurikulum lewat `kemajuanTopik`, paket
 * latihan dalam cakupan Bloom lewat `kemajuanTopikPeta` (migrasi 189), dan
 * trigger migrasi 148 menjamin butirnya tidak pernah beririsan. Tapi keduanya
 * digambar sebagai "persen besar + pita + titik + bilah + legenda" yang sama
 * persis, jadi orang tua melihat dua angka yang tampak sebanding padahal bukan,
 * dan tidak ada apa pun di layar yang menyebutkan bedanya.
 *
 * Sekarang bedanya DIDEKLARASIKAN, bukan tersirat. Menambah tab keempat berarti
 * menambah anggota union ini, dan kompilator yang menagih kalimat serta bilah
 * untuknya — bukan sebuah komponen baru yang kebetulan mirip.
 */
export type SorotanBaris =
  /** Seberapa dikuasai: persen atas SELURUH soal topik, dengan nama pitanya. */
  | { jenis: 'penguasaan'; persen: number | null; label: string | null }
  /** Berapa banyak yang sudah selesai: paket tuntas dari paket yang ada. */
  | { jenis: 'ketuntasan'; tuntas: number; total: number }

/**
 * Satu baris penguasaan, apa pun lapisan asalnya.
 *
 * Isinya sengaja tinggal segini. Versi sebelumnya menerima tiga belas field —
 * `pitaKunci`, `awal`, `paketSempurna`, `rincian`, `subjectId`, dan seterusnya —
 * dan dua di antaranya (`pitaKunci`, `tuntas`) bahkan tidak pernah digambar
 * kartunya: keduanya ikut menumpang karena halaman pemanggilnya membutuhkan
 * mereka untuk ringkasan dan pengelompokannya sendiri. Sekarang keperluan itu
 * tinggal di tipe baris lokal tiap halaman, dan yang menyeberang ke sini hanya
 * yang benar-benar digambar.
 */
export interface BarisPenguasaan {
  /** Id grup kurikulum (uuid) atau kode topik peta (`D-01`). Keduanya alamat. */
  kunci: string
  nama: string
  keterangan: string | null
  /**
   * Elemen topik peta (`bilangan`, `aljabar`, ...), atau null.
   *
   * Null untuk baris jalur GRUP, dan itu bukan data yang hilang: bab kurikulum
   * tidak punya elemen, dan kartunya memang tidak menggambar ikon apa pun.
   * Ikonnya menandai tema, bukan menghias baris — baris yang temanya tidak
   * diketahui lebih baik tanpa lingkaran abu-abu yang tidak menjelaskan apa
   * pun.
   */
  elemen?: string | null
  sorotan: SorotanBaris
}

/**
 * Kalimat status dan label bagi pembaca layar, dirakit dari sorotannya.
 *
 * Satu tempat, bukan dua cabang JSX: kalimat yang dibaca mata dan kalimat yang
 * didengar pembaca layar harus kalimat yang SAMA, dan dua rantai ternari yang
 * berdampingan pasti akan berbeda pada suatu hari.
 */
function kalimatSorotan(s: SorotanBaris): { teks: string; terisi: number; dari: number } {
  if (s.jenis === 'ketuntasan') {
    return {
      teks: `Tuntas ${s.tuntas} dari ${s.total} paket`,
      terisi: s.tuntas,
      dari: s.total,
    }
  }
  // Persen yang tidak diketahui ditulis "—", BUKAN nol persen: penyebut yang
  // belum diketahui bukan kabar buruk tentang anaknya.
  if (s.persen == null) return { teks: '—', terisi: 0, dari: 0 }
  return {
    teks: [s.label, `${s.persen}%`].filter(Boolean).join(' · '),
    terisi: s.persen,
    dari: 100,
  }
}

/**
 * Kartu baris rapor, dipakai dua tab.
 *
 * Empat baris, dan tidak lebih: nama, keterangan, satu kalimat status, satu
 * bilah. Yang dulu ikut di sini — titik `Keyakinan`, legenda "5 benar · 3 salah
 * · 4 belum", "8/12 soal dikerjakan", "Naik dari 20%" — semuanya SUDAH dirender
 * utuh di halaman rincian yang jadi tujuan ketukan kartunya (`RincianGrup` dan
 * `RincianMisi`). Jadi ini pengurangan, bukan pemangkasan: tidak ada satu pun
 * angka yang jadi tidak bisa dibaca, yang berubah cuma berapa jauh ia dari
 * layar pertama.
 *
 * Alasan memangkasnya: enam pengkodean angka dalam satu baris adalah enam hal
 * yang harus dibaca dulu sebelum orang tua tahu anaknya bagaimana — di daftar
 * dua puluh baris, di layar 390px, dalam kunjungan sekali seminggu.
 *
 * Namanya di ATAS keterangannya, kebalikan dari susunan lama. Yang dicari
 * pembaca adalah nama topiknya; "Aljabar · Kelas 7" cuma menjawab "yang mana",
 * dan pertanyaan itu datang kedua.
 */
export default function KartuPenguasaan({
  b,
  studentId,
}: {
  b: BarisPenguasaan
  studentId: string
}) {
  const { teks, terisi, dari } = kalimatSorotan(b.sorotan)
  return (
    <li>
      {/* Seluruh kartunya tautan, bukan cuma namanya: sasaran
          sentuh setinggi kartunya sendiri adalah satu-satunya
          ukuran yang masuk akal di ponsel. */}
      <Link
        href={`/keluarga/${studentId}/penguasaan/${b.kunci}`}
        className="block rounded-xl bg-white p-4 shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-100"
      >
        <div className="flex items-start gap-3">
          {b.elemen && <IkonTema elemen={b.elemen} size={36} />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-tight text-gray-900">{b.nama}</p>
            {b.keterangan && <p className="mt-0.5 text-xs text-gray-400">{b.keterangan}</p>}
          </div>
          <span className="shrink-0 text-gray-300" aria-hidden>
            ›
          </span>
        </div>

        <p className="mt-3 text-sm font-medium tabular-nums text-gray-600">{teks}</p>
        <BilahKemajuan terisi={terisi} dari={dari} label={teks} className="mt-2" />
      </Link>
    </li>
  )
}
