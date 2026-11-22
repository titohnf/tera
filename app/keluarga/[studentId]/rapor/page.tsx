import Link from 'next/link'
import { CircleCheckBig, ClipboardCheck, NotebookPen, TrendingUp, type LucideIcon } from 'lucide-react'
import { anakOrRedirect } from '@/lib/keluarga'
import {
  rangkumanLaporan,
  type RangkumanKelas,
  type RangkumanMandiri,
  type RangkumanKetuntasan,
} from '@/lib/reports/ringkasan-laporan'
import { bulanIni } from '@/lib/waktu'
import { BilahRapor, GrafikNilaiBulanan, MAKS_SERI } from '@/components/keluarga/BilahRapor'
import { muatMasukanAnak } from '@/lib/tryout/hasil-anak'
import { kategoriNilai, WARNA_KATEGORI } from '@/lib/tryout/kategori-nilai'
import { susunRiwayat, type RiwayatMapel } from '@/lib/tryout/riwayat-kemampuan'

/**
 * Rapor: pintu masuk ketiga laporan seorang anak.
 *
 * Ini yang menggantikan bilah tab. Bilah itu menuntut orang tua MEMILIH sebelum
 * diberi tahu apa pun — tiga nama tanpa isi, lalu tiga daftar panjang yang
 * semuanya menjawab "topik ini bagaimana" sementara yang ditanyakan "anak saya
 * bagaimana". Sekarang jawabannya di layar pertama, dan ketiga laporan jadi
 * kartu yang dibuka kalau memang mau ditelusuri.
 *
 * Rangkuman tiap laporan dipecah PER MAPEL, tidak diringkas jadi satu angka.
 * Satu angka gabungan menuntut penyebut gabungan, dan ketiga laporan ini justru
 * berdiri terpisah karena penyebutnya berlainan.
 *
 * Rutenya `/rapor`, bukan `/laporan`. `/laporan` tetap milik Progres Kelas
 * karena notifikasi laporan bulanan menaut ke sana lengkap dengan `?month=`
 * (lihat `lib/keluarga-notifikasi.ts`) — memindahkannya berarti memutus tautan
 * yang sudah terkirim ke orang tua.
 */
export default async function RaporPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const sekarang = await bulanIni()
  const r = await rangkumanLaporan(studentId, sekarang)
  // Sama dengan halaman Hasil Try Out: hanya try out yang hasilnya sudah dibuka admin.
  const riwayatTryOut = susunRiwayat(await muatMasukanAnak(studentId))

  return (
    // Tanpa kalimat pembuka. Ketiga kartunya berjudul, berketerangan, dan
    // berujung panah — layar ini sudah menerangkan dirinya sendiri, dan sebuah
    // kalimat yang cuma mengatakan "ini rangkuman, ketuk untuk rincian" adalah
    // baris yang dibaca sekali lalu dilewati selamanya.
    <div className="space-y-4">
      {/* Keterangan kartu inilah yang menyebutkan angka-angka di dalamnya
          ANGKA APA. Nama mapel di kepala tiap kolom cuma menjawab "milik
          siapa"; tanpa kalimat ini, "75" adalah bilangan tanpa satuan.
          Ia ditaruh di sini, bukan sebagai label di atas tabel, karena ia
          berlaku untuk SELURUH isi kartu — rata-rata semesteran di tabel
          maupun rata-rata bulanan di grafiknya — dan keterangan adalah tempat
          yang dibaca sebelum angkanya, bukan sesudah. */}
      <KartuLaporan
        judul="Progres Kelas"
        ikon={TrendingUp}
        keterangan={`Rata-rata nilai asesmen ${r.semesterLabel}`}
        href={`/keluarga/${studentId}/laporan`}
      >
        {r.kelas === null ? (
          <Kosong>Belum terdaftar di kelas mana pun.</Kosong>
        ) : r.kelas.length === 0 ? (
          <Kosong>Belum ada sesi yang selesai.</Kosong>
        ) : (
          <>
            <TabelMapel kelas={r.kelas} />
            <GrafikKelas kelas={r.kelas} bulan={r.bulanLabel} />
          </>
        )}
      </KartuLaporan>

      <KartuLaporan
        judul="Latihan Mandiri"
        ikon={NotebookPen}
        keterangan="Rata-rata nilai latihan per mapel yang dikerjakan secara mandiri dari menu Belajar"
        href={`/keluarga/${studentId}/penguasaan`}
      >
        {/* Mapel yang belum disentuh TIDAK ditampilkan sebagai baris nol.
            "Topik selesai 0% · 0/14" adalah empat angka yang semuanya cuma
            mengatakan satu hal — belum ada apa-apa — dan satu kalimat
            mengatakannya lebih cepat. Begitu ada satu saja yang dikerjakan,
            barisnya kembali. */}
        {r.mandiri === null ? (
          <Kosong>Belum bisa dibaca sekarang.</Kosong>
        ) : r.mandiri.every(m => m.rataRata == null) ? (
          <Kosong>Belum ada latihan mandiri yang dikerjakan.</Kosong>
        ) : (
          r.mandiri
            .filter(m => m.rataRata != null)
            .map(m => <BarisMandiri key={m.mapel} m={m} />)
        )}
      </KartuLaporan>

      <KartuLaporan
        judul="Ketuntasan Materi"
        ikon={CircleCheckBig}
        keterangan="Penguasaan materi tiap mapel sesuai standar ketuntasan di setiap kelas, dari menu Misi"
        href={`/keluarga/${studentId}/ketuntasan`}
        isiDiLuarTautan
      >
        {/* Tiga keadaan, tiga kalimat berbeda: tidak punya peta bukan salah anaknya, gagal dibaca
            bukan salah siapa pun, dan belum dikerjakan adalah satu-satunya yang menunggu anaknya.
            Semua mapel tampil: yang belum disentuh berlencana "Belum dimulai", bukan hilang. */}
        {r.ketuntasanPerMapel === null || r.ketuntasanPerMapel.length === 0 ? (
          <Kosong>Belum ada peta kompetensi untuk anak ini.</Kosong>
        ) : (
          <ul className="-my-2 divide-y divide-slate-100">
            {r.ketuntasanPerMapel
              .map(k => (
                <li key={k.mapel}>
                  <Link
                    href={`/keluarga/${studentId}/ketuntasan?mapel=${encodeURIComponent(k.mapel)}`}
                    className="block rounded-md py-3 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <span className="flex items-start gap-3">
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-900">{k.mapel}</span>
                      {/* Status sejajar dengan nama mapel, rata kanan; bilah di bawah sebagai pelengkap. */}
                      <span className="flex max-w-[62%] flex-col items-end gap-1 text-right">
                        {statusMapel(k).map(st => (
                          <span key={st.teks} className="flex items-start justify-end gap-2 text-sm leading-snug text-gray-700">
                            {st.teks}
                            <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${st.titik}`} aria-hidden />
                          </span>
                        ))}
                      </span>
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                    <span className="mt-3 flex">
                      <LangkahKelas k={k} />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </KartuLaporan>

      <KartuLaporan
        judul="Hasil Try Out"
        ikon={ClipboardCheck}
        keterangan="Skor try out dan kemampuan anak per bidang dan topik"
        href={`/keluarga/${studentId}/tryout`}
        isiDiLuarTautan
      >
        {riwayatTryOut.length === 0 ? (
          <Kosong>Belum ada hasil try out untuk anak ini.</Kosong>
        ) : (
          <NilaiTryOut daftar={riwayatTryOut} dasar={`/keluarga/${studentId}/tryout`} />
        )}
      </KartuLaporan>
    </div>
  )
}

/**
 * Kartu satu laporan: judul, keterangan, rangkuman, lalu pintu.
 *
 * Seluruh kartunya tautan — sasaran sentuh setinggi kartunya sendiri adalah
 * satu-satunya ukuran yang masuk akal di ponsel, dan pola yang sama sudah
 * dipakai `KartuPenguasaan`.
 */
function KartuLaporan({
  judul,
  ikon: Ikon,
  keterangan,
  href,
  isiDiLuarTautan = false,
  children,
}: {
  judul: string
  /** Ikon sederhana di depan judul. */
  ikon: LucideIcon
  keterangan: string
  href: string
  /** Kartu tanpa tautan sendiri: tujuannya ada di tiap baris isinya. */
  isiDiLuarTautan?: boolean
  children: React.ReactNode
}) {
  const kepala = (
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600" aria-hidden>
          <Ikon size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-tight text-gray-900">{judul}</p>
          <p className="mt-1 text-sm leading-snug text-gray-500">{keterangan}</p>
        </div>
        {/* Chevron gambar, bukan karakter "›". Karakternya digambar setipis
            tanda kutip pada ukuran teks biasa dan berwarna gray-300 nyaris
            lenyap di alas putih — kartunya jadi tidak terbaca sebagai sesuatu
            yang bisa diketuk. Goresan 2px pada 18px terbaca dari jarak baca
            ponsel, dan gray-400 cukup gelap untuk terlihat tanpa bersaing
            dengan judulnya. */}
        {!isiDiLuarTautan && (
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </div>
  )
  const isi = <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">{children}</div>

  if (isiDiLuarTautan) {
    return (
      // Kepalanya bukan tautan dan tanpa panah: tujuannya ada di tiap baris isinya, per mapel.
      <div className="rounded-xl bg-white p-4 shadow-kartu sm:p-5">
        {kepala}
        {isi}
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white p-4 shadow-kartu transition hover:shadow-kartu-naik active:bg-slate-100 sm:p-5"
    >
      {kepala}
      {isi}
    </Link>
  )
}

/**
 * Hasil try out terakhir tiap mapel sebagai daftar ringkas: satu baris per mapel berisi nama mapel,
 * nilai try out terakhirnya, kategorinya, dan panah ke rincian mapel itu (`?mapel=`). Seluruh baris
 * adalah tautan; riwayat TO dan rincian topik ada di halaman rinciannya.
 */
function NilaiTryOut({ daftar, dasar }: { daftar: RiwayatMapel[]; dasar: string }) {
  return (
    <ul className="-my-2 divide-y divide-slate-100">
      {daftar.map(m => {
        const urutan = m.tryOut.length
        const nilai = m.tryOut[urutan - 1]?.nilai ?? null
        const kategori = kategoriNilai(nilai)
        return (
          <li key={m.kunci}>
            <Link
              href={`${dasar}?mapel=${encodeURIComponent(m.kunci)}`}
              className="flex items-center gap-3 rounded-md py-3 hover:bg-slate-50 active:bg-slate-100"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-gray-900">{m.judul}</span>
                <span className="mt-0.5 block text-sm text-gray-500">Try Out ke-{urutan}</span>
              </span>
              <span className="shrink-0 text-xl font-semibold tabular-nums text-gray-900">
                {nilai === null ? '–' : nilai.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
              </span>
              {kategori && (
                <span className={`w-[5.25rem] shrink-0 rounded-full px-2 py-1 text-center text-xs font-semibold ring-1 ${WARNA_KATEGORI[kategori]}`}>{kategori}</span>
              )}
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Status satu mapel sebagai baris teks dengan titik berwarna. Dua kabar yang bisa muncul bersamaan:
 * - biru: kelas yang SEDANG dikerjakan ("Sedang mengerjakan materi kelas L"), yaitu kelas pertama yang
 *   belum penuh;
 * - hijau: kelas-kelas yang SELURUH materinya sudah tuntas ("Seluruh materi kelas 1, 2, 5 tuntas"),
 *   disebut satu per satu karena bisa tidak berurutan. Semua kelas tuntas jadi "Semua materi tuntas".
 * Belum ada yang dikerjakan: satu lencana abu-abu "Belum dimulai". Sengaja bukan "setara kelas N": ini
 * ukuran internal Tera, bukan perbandingan dengan anak lain, dan kata "materi" selalu ada supaya tidak
 * terbaca sebagai kelas sekolah anak. Mapel tanpa aturan kumulatif hanya memakai "N topik tuntas".
 */
function statusMapel(k: RangkumanKetuntasan): { teks: string; titik: string }[] {
  const HIJAU = 'bg-emerald-500'
  const BIRU = 'bg-blue-600'
  const ABU = 'bg-gray-300'
  if (k.dikerjakan === 0) return [{ teks: 'Belum dimulai', titik: ABU }]
  const penuh = k.jenjang.filter(j => j.topik > 0 && j.tuntas === j.topik).map(j => j.label)
  if (k.jenjang.length > 0 && penuh.length === k.jenjang.length) return [{ teks: 'Semua materi tuntas', titik: HIJAU }]
  const sedang = k.aturan === 'resmi' ? k.jenjang.find(j => j.tuntas < j.topik) : undefined
  const hasil: { teks: string; titik: string }[] = []
  if (sedang) hasil.push({ teks: `Sedang mengerjakan materi kelas ${sedang.label}`, titik: BIRU })
  if (penuh.length > 0) hasil.push({ teks: `Seluruh materi kelas ${penuh.join(', ')} tuntas`, titik: HIJAU })
  if (hasil.length === 0) hasil.push({ teks: `${k.tuntas} topik tuntas`, titik: ABU })
  return hasil
}

/**
 * Seluruh kelas sebagai satu bilah bersekat: tiap kelas satu kelompok yang lebarnya mengikuti jumlah
 * materinya, dan tiap materi satu petak. Petak yang tuntas terisi (hijau bila seluruh kelas itu tuntas,
 * biru bila belum), sisanya abu-abu. Nomor kelas di bawah kelompoknya; kelas yang sedang dikerjakan
 * dicetak tebal. Petak mengikuti urutan penyelesaian, bukan topik tertentu: yang tersedia hanya
 * jumlah topik tuntas per kelas, bukan topik mana.
 */
function LangkahKelas({ k }: { k: RangkumanKetuntasan }) {
  const sedang = k.aturan === 'resmi' ? k.jenjang.find(j => j.tuntas < j.topik)?.label : undefined
  return (
    <span
      className="flex min-w-0 flex-1 items-start gap-1.5"
      role="img"
      aria-label={`Materi per kelas: ${k.jenjang.map(j => `kelas ${j.label} ${j.tuntas} dari ${j.topik} tuntas`).join(', ')}`}
    >
      {k.jenjang.map(j => {
        const penuh = j.topik > 0 && j.tuntas === j.topik
        return (
          <span key={j.label} aria-hidden className="flex min-w-[1.25rem] basis-0 flex-col gap-1" style={{ flexGrow: Math.max(j.topik, 1) }}>
            <span className="flex h-4 gap-px">
              {Array.from({ length: j.topik }, (_, i) => (
                <span key={i} className={`min-w-0 flex-1 rounded-[2px] ${i < j.tuntas ? (penuh ? 'bg-emerald-500' : 'bg-blue-600') : 'bg-slate-200'}`} />
              ))}
            </span>
            <span className={`text-center text-[11px] leading-none tabular-nums ${j.label === sedang ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{j.label}</span>
          </span>
        )
      })}
    </span>
  )
}

function Kosong({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>
}

/**
 * Rata-rata tiap mapel sebagai tabel: nama di atas, angkanya di bawah.
 *
 * Berkolom, bukan berbaris. Yang dilakukan mata di sini membandingkan angka
 * antar mapel, dan angka yang berdiri berdampingan pada garis dasar yang sama
 * bisa dibandingkan sekali lihat — sementara daftar berbaris menuntut mata
 * melompat turun dan menahan angka pertama dalam ingatan.
 *
 * Pemisahnya garis tegak setipis rambut, bukan kotak: yang perlu ditandai cuma
 * "kolom ini berhenti di sini". Kolom terakhir tidak berpemisah, jadi tabelnya
 * tidak tampak terpotong di tepi kartunya.
 *
 * Kehadiran tidak ada di sini. Kartu ini pintu, bukan laporan — dan kehadiran
 * adalah angka yang dibuka orang tua saat mereka memang sedang
 * mempertanyakannya, bukan yang dicari sambil lewat. Ia menunggu satu ketukan
 * lebih dalam, di halaman yang kartunya tuju.
 */
function TabelMapel({ kelas }: { kelas: RangkumanKelas[] }) {
  return (
    <div className="flex divide-x divide-slate-100">
      {kelas.map(m => (
        <div key={m.mapel} className="min-w-0 flex-1 px-3 first:pl-0 last:pr-0">
          <p className="truncate text-sm text-gray-500">{m.mapel}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">
            {/* Em dash, bukan nol: mapel yang belum pernah diasesmen tidak
                bernilai nol, ia belum punya nilai sama sekali. */}
            {m.rataRata ?? '—'}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Grafik nilai enam bulan untuk seluruh mapel, satu bidang.
 *
 * Mapel yang belum punya satu pun asesmen di jendela ini TIDAK ikut jadi garis:
 * seri yang seluruh titiknya kosong cuma menambah satu baris legenda yang tidak
 * menunjuk apa-apa. Angkanya tetap terbaca di daftar teks di atas.
 *
 * Dipotong di `MAKS_SERI` garis, dan yang bertahan adalah mapel dengan sesi
 * terbanyak. Batas itu bukan selera ruang melainkan batas paletnya — lihat
 * catatan di `BilahRapor`. Yang tidak masuk disebutkan, bukan dihilangkan
 * diam-diam: daftar yang lebih panjang daripada grafiknya harus punya
 * penjelasan di layar yang sama.
 */
function GrafikKelas({ kelas, bulan }: { kelas: RangkumanKelas[]; bulan: string[] }) {
  const bergrafik = kelas.filter(m => m.nilaiBulanan.some(v => v != null))
  if (bergrafik.length === 0) return null

  const tampil = bergrafik.slice(0, MAKS_SERI)
  const sisa = bergrafik.length - tampil.length

  return (
    // Bergaris pemisah dari tabel di atasnya: keduanya membaca periode yang
    // sama tapi menjawab hal yang berbeda — tabel "seberapa bagus semester
    // ini", grafik "bergerak ke mana". Tanpa garis, angka besar di tabel dan
    // sumbu grafik terbaca sebagai satu blok yang sama.
    <div className="mt-3 border-t border-slate-100 pt-3">
      <GrafikNilaiBulanan
        seri={tampil.map(m => ({ mapel: m.mapel, nilai: m.nilaiBulanan }))}
        bulan={bulan}
      />
      {sisa > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Grafik menampilkan {MAKS_SERI} mapel dengan sesi terbanyak; {sisa} mapel lain
          tidak digambar.
        </p>
      )}
    </div>
  )
}

/**
 * Satu mapel di kartu Latihan Mandiri: cakupannya persentase, skornya berbilah.
 *
 * Tidak ada grafik bulanan di sini, dan itu bukan kelalaian: penguasaan topik
 * adalah keadaan SEKARANG, bukan deret peristiwa bertanggal. Mengulang sebuah
 * topik menimpa nilainya alih-alih menambah titik baru (migrasi 128), jadi
 * tidak ada sumbu waktu yang bisa digambar tanpa mengarangnya.
 */
function BarisMandiri({ m }: { m: RangkumanMandiri }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold tracking-tight text-gray-900">{m.mapel}</p>
      <p className="text-sm text-gray-500">
        Topik selesai {m.topik > 0 ? Math.round((m.selesai / m.topik) * 100) : 0}% · {m.selesai}/
        {m.topik} Topik
      </p>
      {m.rataRata != null && (
        <BilahRapor nama="Skor" nilai={m.rataRata} teks={String(m.rataRata)} />
      )}
    </div>
  )
}
