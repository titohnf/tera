/**
 * Jam sekarang, dibaca di server dan diturunkan sebagai prop.
 *
 * Alasannya sama dengan `sejakJam()` di lib/keluarga.ts: aturan lint
 * `react-hooks/purity` melarang memanggil fungsi tak-murni saat render, dan
 * `Date.now()` adalah salah satunya. Membacanya di useEffect juga tidak bisa —
 * itu berarti setState sinkron di dalam efek, yang memicu render berantai.
 *
 * Menurunkannya dari server sekaligus menutup masalah kedua: jam server dan jam
 * perangkat pembaca tidak sama, dan menghitung "sesi berikutnya" di kedua sisi
 * membuat HTML hasil render server berbeda dengan hasil hidrasi di browser.
 */
export async function sekarangIso(): Promise<string> {
  return new Date().toISOString()
}

/**
 * Bulan berjalan, dipisahkan dari badan komponen dengan alasan yang sama
 * seperti `sekarangIso` di atas.
 *
 * Dulu tinggal di lib/keluarga.ts. Ia pindah ke sini begitu halaman detail
 * siswa admin ikut memerlukannya: membaca jam bukan urusan portal keluarga, dan
 * halaman admin tidak semestinya mengimpor modul keluarga cuma untuk tahu
 * sekarang bulan berapa.
 */
export async function bulanIni(): Promise<{ tahun: number; bulan: number }> {
  const d = new Date()
  return { tahun: d.getFullYear(), bulan: d.getMonth() + 1 }
}
