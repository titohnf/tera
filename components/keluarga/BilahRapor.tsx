/**
 * Primitif grafik untuk kartu-kartu di `/rapor`.
 *
 * Warna di halaman ini punya SATU pekerjaan: membedakan mapel. Ia dipakai di
 * tempat yang memang punya identitas untuk dibedakan — grafik nilai per bulan,
 * yang menumpuk beberapa mapel dalam satu bidang — dan tidak di tempat lain.
 *
 * Semua BILAH sewarna biru primer aplikasi — satu warna, tanpa kecuali. Tiap
 * bilah cuma menggambar satu hal ("berapa banyak dari berapa"), jadi tidak ada
 * identitas yang perlu diwarnai; yang membedakan barisnya adalah namanya.
 *
 * Birunya memang berdekatan dengan biru seri pertama di grafik, dan itu bisa
 * ditanggung karena keduanya TIDAK PERNAH satu kartu: grafik cuma ada di
 * Progres Kelas, bilah cuma ada di dua kartu lainnya. Yang tidak boleh terjadi
 * — satu bidang gambar yang memakai biru untuk dua hal — tidak terjadi.
 *
 * Versi sebelumnya memakai biru untuk "seberapa banyak selesai" dan oranye
 * untuk "seberapa bagus". Aturan itu runtuh begitu grafik per mapel digabung
 * jadi satu: di dalam grafik, biru dan oranye harus berarti IPA dan Matematika,
 * dan satu halaman tidak boleh memakai warna yang sama untuk dua pekerjaan.
 * Yang dilepas adalah yang lebih lemah — pembedaan jenis ukuran sudah dibawa
 * kata-katanya sendiri ("Kehadiran", "Skor"), sementara pembedaan mapel di
 * dalam satu bidang gambar memang tidak punya kanal lain.
 *
 * Palet mapelnya tiga slot pertama palet kategorikal baku, dan sudah dijalankan
 * lewat validator pada mode SEMUA PASANGAN — bukan pasangan bersebelahan —
 * karena garis boleh saling menyilang sehingga tiap pasangan bisa berdampingan:
 * CVD ΔE 9.2 terburuk (deutan), penglihatan normal ΔE 24.0. Slot ketiga (aqua)
 * kontrasnya 2.74:1 terhadap alas putih, di bawah 3:1, jadi aturan reliefnya
 * berlaku dan dipenuhi: legendanya bertuliskan NAMA mapel di sebelah petaknya,
 * jadi identitas tidak pernah bergantung pada warna saja. Tiga adalah batasnya
 * — slot keempat menaruh kuning dan oranye di satu layar, pasangan yang gagal
 * pada mode semua-pasangan.
 *
 * TIDAK ADA lapisan hover, dan itu disengaja. Kartunya sendiri TAUTAN yang
 * diketuk di ponsel, jadi tooltip berebut dengan ketukan yang sebenarnya
 * diinginkan; dan tiap bilah sudah berlabel nilainya langsung. Yang biasanya
 * disembunyikan tooltip di sini sudah tertulis.
 */

/**
 * Warna mapel, dipakai berurutan dan TIDAK PERNAH didaur ulang. Mapel keempat
 * bukan hue baru — ia tidak masuk grafik, dan angkanya tetap terbaca di daftar
 * teks di atasnya.
 */
export const WARNA_MAPEL = ['#2a78d6', '#eb6834', '#1baf7a'] as const

/** Banyaknya garis yang boleh berdiri dalam satu bidang. Lihat catatan palet. */
export const MAKS_SERI = WARNA_MAPEL.length

/**
 * Satu bilah berlabel: nama di kiri, bilah di tengah, angkanya di ujung kanan.
 *
 * Kolom kiri dan kanannya SEMPIT dan itu bukan kebetulan. Versi sebelumnya
 * memesan delapan puluh piksel untuk masing-masing, dan angka "20" yang cuma
 * dua digit tetap memakan seluruh kolomnya — bilah berhenti hampir seratus
 * piksel sebelum tepi kartu, dan selisih antara 20 dan 76 jadi jauh lebih
 * kecil daripada yang sebenarnya. Sekarang keduanya sesempit isi terpanjang
 * yang mungkin muncul, dan sisanya milik bilahnya.
 *
 * Kolomnya tetap BERLEBAR TETAP, bukan seukuran isi. Di daftar bertingkat —
 * Kelas 7, Kelas 8, Kelas 9 — pangkal dan ujung bilah harus lurus dari baris
 * ke baris, kalau tidak panjangnya tidak bisa dibandingkan sekali lihat, dan
 * membandingkan panjang persis alasan bilah ini ada.
 *
 * `nilai` selalu 0–100 supaya seluruh bilah di satu kartu berbagi SATU sumbu.
 * Dua ukuran berskala beda tidak boleh berdampingan sebagai bilah — itu sumbu
 * ganda yang menyamar.
 *
 * `teks` yang ditulis di ujung bukan `nilai` mentah: yang dibaca orang tua
 * "3/7", bukan "43". Panjang bilahnya proporsi, tulisannya cacah.
 */
export function BilahRapor({
  nama,
  nilai,
  teks,
}: {
  nama: string
  /** Panjang bilah dalam persen, 0–100. */
  nilai: number
  /** Yang tertulis di ujung bilah — angka apa adanya, bukan persennya. */
  teks: string
}) {
  const lebar = Math.min(100, Math.max(0, nilai))
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-14 shrink-0 truncate text-xs text-gray-500">{nama}</span>
      <span
        className="h-2 min-w-0 flex-1 overflow-hidden bg-gray-100"
        role="img"
        aria-label={`${nama}: ${teks}`}
      >
        {/* Siku di pangkal, membulat 4px di ujung datanya: bilah yang membulat
            di kedua ujung memindahkan titik nolnya beberapa piksel ke kanan,
            dan nilai kecil jadi tampak lebih besar daripada yang sebenarnya. */}
        <span
          className="block h-full bg-blue-600"
          style={{ width: `${lebar}%`, borderRadius: '0 4px 4px 0' }}
        />
      </span>
      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-900">
        {teks}
      </span>
    </div>
  )
}

/**
 * Tanda sumbu tegak: seperempatan, angka bulat yang tidak perlu dihitung.
 *
 * Lima, bukan tiga. Sejak angka di tiap titik dilepas, tinggi titiklah
 * satu-satunya yang mengabarkan nilainya — dan dengan tanda tiap 50 selisih
 * antara 62 dan 78 cuma bisa dikira-kira. Tiap 25 membuatnya bisa dibaca
 * sampai belasan tanpa membuat sumbunya jadi tangga yang menuntut dibaca.
 */
const TANDA_SUMBU = [0, 25, 50, 75, 100]

export interface SeriBulanan {
  mapel: string
  /** Sejajar `bulan`; null berarti bulan itu tidak punya asesmen. */
  nilai: (number | null)[]
}

/**
 * Nilai per bulan, SELURUH mapel dalam satu bidang.
 *
 * Bentuknya deret waktu, jadi ia garis dan bukan bilah: yang ditanyakan
 * "membaik atau memburuk", dan itu pertanyaan tentang kemiringan.
 *
 * Satu bidang, bukan satu panel per mapel. Panel terpisah membuat mata
 * membandingkan dua gambar; satu bidang membuatnya membandingkan dua garis —
 * dan pertanyaan yang dibawa orang tua justru "mapel mana yang tertinggal",
 * pertanyaan perbandingan.
 *
 * SUMBUNYA SATU: 0–100 tegak untuk semua garis. Tidak ada sumbu kedua di kanan,
 * apa pun alasannya — dua skala dalam satu bidang membuat dua garis yang
 * berpotongan tampak "bertemu" pada nilai yang sebenarnya tidak sama.
 *
 * BULAN TANPA ASESMEN MEMUTUS GARISNYA, bukan ditarik lurus melewatinya.
 * Menyambungkan dua titik yang terpisah bulan kosong berarti menggambar nilai
 * yang tidak pernah ada — dan kemiringan palsu itu justru bagian yang dibaca
 * orang. Bulan sepi memang harus terlihat sepi.
 *
 * Digambar SVG yang diregangkan (`preserveAspectRatio="none"`) supaya sumbu
 * mendatarnya persis sejajar dengan label bulan di bawahnya, sementara garisnya
 * memakai `vector-effect` agar tebalnya tidak ikut teregang. Titiknya bukan
 * `circle` melainkan elemen berposisi persen di atasnya — lingkaran di dalam
 * SVG yang diregangkan akan berubah jadi lonjong.
 */
export function GrafikNilaiBulanan({ seri, bulan }: { seri: SeriBulanan[]; bulan: string[] }) {
  const n = bulan.length
  if (n === 0 || seri.length === 0) return null

  // Pinggiran tipis di keempat sisi: titik digambar dari TENGAHNYA, jadi apa
  // pun yang duduk persis di tepi kehilangan separuh badannya — dan yang paling
  // sering duduk di tepi atas justru nilai sempurna, satu-satunya yang paling
  // tidak boleh tampak cacat.
  const x = (i: number) => (n === 1 ? 50 : 4 + (i / (n - 1)) * 92)
  const y = (v: number) => 8 + (100 - Math.min(100, Math.max(0, v))) * 0.84

  const dibaca = seri.map((s, iSeri) => {
    const titik = s.nilai
      .map((v, i) => (v == null ? null : { i, x: x(i), y: y(v) }))
      .filter((t): t is { i: number; x: number; y: number } => t !== null)

    // Dipecah jadi ruas-ruas yang bulannya benar-benar berurutan. Ruas
    // sepanjang satu titik tidak digambar garisnya — titiknya sendiri bercerita.
    const ruas: (typeof titik)[] = []
    for (const t of titik) {
      const akhir = ruas[ruas.length - 1]
      if (akhir && akhir[akhir.length - 1].i === t.i - 1) akhir.push(t)
      else ruas.push([t])
    }
    return { ...s, warna: WARNA_MAPEL[iSeri % WARNA_MAPEL.length], titik, ruas }
  })

  return (
    <div>
      {/* Tidak ada judul di atas grafik ini, dan tidak perlu ada. "0–100"
          diucapkan sumbu-y, periodenya diucapkan keterangan kartu, dan apa yang
          digambar diucapkan legendanya sendiri — tiga hal yang sudah punya
          tempatnya masing-masing. Judul di sini cuma akan mengulang salah satu
          dari ketiganya.

          Legenda selalu ada begitu garisnya lebih dari satu — kanal identitas
          yang tidak menuntut mata yang bisa memisahkan hue. Namanya bertinta
          teks, bukan berwarna serinya: hue kategorikal seterang ini tidak
          terbaca sebagai tulisan. */}
      {dibaca.length > 1 && (
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {dibaca.map(s => (
            <span key={s.mapel} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.warna }}
                aria-hidden
              />
              {s.mapel}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1.5 flex h-24">
        {/* Gutter sumbu-y. Angkanya HTML dan berdiri di luar bidang gambarnya,
            bukan `<text>` di dalam SVG: SVG-nya diregangkan mendatar supaya
            sumbu waktunya sejajar dengan label bulan, dan teks di dalam gambar
            yang diregangkan ikut melar jadi pipih.

            Tiga tanda saja — 0, 50, 100 — angka bulat yang tidak perlu dibaca
            dua kali. Garisnya menyusul di dalam SVG pada ketinggian yang sama
            persis, lewat `y()` yang sama. */}
        <div className="relative w-7 shrink-0">
          {TANDA_SUMBU.map(v => (
            <span
              key={v}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-gray-400"
              style={{ top: `${y(v)}%` }}
            >
              {v}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={dibaca
            .map(
              s =>
                `${s.mapel}: ${bulan
                  .map((b, i) => `${b} ${s.nilai[i] ?? 'tidak ada asesmen'}`)
                  .join(', ')}`,
            )
            .join('. ')}
        >
          {/* Batas atas dan bawah skalanya — dua garis rambut yang membuat
              tinggi sebuah titik punya arti. Solid, bukan putus-putus: garis
              putus terbaca sebagai ambang atau ramalan, padahal ini pembatas. */}
          {TANDA_SUMBU.map(v => (
            <line
              key={v}
              x1="0"
              x2="100"
              y1={y(v)}
              y2={y(v)}
              stroke="#e5e7eb"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {dibaca.map(s =>
            s.ruas
              .filter(r => r.length > 1)
              .map(r => (
                <polyline
                  key={`${s.mapel}-${r[0].i}`}
                  points={r.map(t => `${t.x},${t.y}`).join(' ')}
                  fill="none"
                  stroke={s.warna}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )),
          )}
        </svg>

        {/* Cincin putih 2px di tiap titik: begitu dua mapel bernilai sama di
            bulan yang sama, titiknya bertindih dan tanpa cincin keduanya
            melebur jadi satu noda. */}
        {dibaca.map(s =>
          s.titik.map(t => (
            <span
              key={`${s.mapel}-${t.i}`}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
              style={{ left: `${t.x}%`, top: `${t.y}%`, backgroundColor: s.warna }}
              aria-hidden
            />
          )),
        )}

        </div>
      </div>

      {/* Label bulan sebagai teks HTML, dengan alasan yang sama dengan tanda
          sumbu-y. Gutter selebar gutter di atasnya menjaga `left: x%` di sini
          mengukur bidang yang sama dengan `left: x%` titik-titiknya. */}
      <div className="mt-1 flex h-3">
        <div className="w-7 shrink-0" aria-hidden />
        <div className="relative min-w-0 flex-1">
          {bulan.map((b, i) => (
            <span
              key={b + i}
              className="absolute -translate-x-1/2 text-[10px] tabular-nums text-gray-400"
              style={{ left: `${x(i)}%` }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
