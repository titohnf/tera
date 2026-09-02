/**
 * Cincin kemajuan berisi angka persennya.
 *
 * Dulu tinggal di dalam `KartuLatihan` (kartu "Lanjutkan latihan" di beranda).
 * Ia pindah ke sini begitu riwayat latihan ikut memakainya — dan itu memang
 * tujuannya: dua layar yang menyebutkan persen sebuah sesi harus
 * menggambarkannya dengan bentuk yang sama, kalau tidak pembacanya menyangka
 * keduanya mengukur hal yang berbeda.
 *
 * Digambar dengan `stroke-dasharray` pada satu lingkaran, bukan dengan dua
 * bingkai bertumpuk: kelilingnya dihitung sekali (2πr), lalu panjang goresnya
 * tinggal sekian persen darinya. Goresnya 6 satuan, bukan 4: cincin setipis 4
 * terbaca seperti garis pinggir, bukan seperti takaran yang sedang terisi.
 * Jari-jarinya turun ke 19 supaya tepi luarnya (19 + 6/2 = 22) tetap punya sisa
 * di dalam kotak 48 — gores yang menyentuh tepi akan terpotong begitu kartunya
 * dirender di layar dengan pembulatan piksel yang berbeda.
 *
 * Petaknya diatur dari luar lewat `ukuran`, sementara `viewBox`-nya tetap 48:
 * semua ukuran di dalam ikut membesar tanpa satu angka pun di sini berubah.
 * Itu sebabnya cincin ini digambar dalam satuan viewBox, bukan piksel.
 * Diputar -90 derajat supaya nolnya mulai dari atas, bukan dari kanan —
 * kemajuan yang dibaca searah jarum jam mulai dari jam 12 adalah satu-satunya
 * bentuk yang tidak perlu dijelaskan.
 *
 * Cincin yang sedang berjalan bergores tosca `#1a9e91` — tosca merek `#20c5b5`
 * yang ditua-kan 20%, karena nada aslinya cuma 2.2:1 terhadap putih dan gores
 * setipis 4px hilang di layar terang. Angkanya sendiri lebih tua lagi
 * (`#13766d`, 5.5:1), sebab teks 11px menuntut ambang yang lebih tinggi
 * daripada bentuk.
 *
 * Yang sudah selesai tetap hijau. Itu bukan warna merek dan memang tidak perlu:
 * hijau di sini mengatakan "beres", bukan "ini Tera".
 */
export default function CincinPersen({
  persen,
  selesai,
  ukuran = 'h-14 w-14',
}: {
  persen: number
  selesai: boolean
  /** Kelas ukuran petaknya, mis. `h-12 w-12`. Isinya ikut sendiri. */
  ukuran?: string
}) {
  const r = 19
  const keliling = 2 * Math.PI * r

  return (
    <span className={`relative grid shrink-0 place-items-center ${ukuran}`}>
      <svg className={`absolute inset-0 -rotate-90 ${ukuran}`} viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="6" className="stroke-slate-100" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={selesai ? 'stroke-emerald-500' : 'stroke-[#1a9e91]'}
          strokeDasharray={`${(keliling * persen) / 100} ${keliling}`}
        />
      </svg>
      <span
        className={`relative text-xs font-bold tabular-nums ${
          selesai ? 'text-emerald-600' : 'text-[#13766d]'
        }`}
      >
        {persen}%
      </span>
    </span>
  )
}
