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

/** Nama hari, jam, dan tanggal sebuah sesi — dibaca dalam WIB. */
export interface LabelSesi {
  /** "Hari ini", "Besok", "Lusa", atau nama hari — baris besar di kartu. */
  hari: string
  /** Jam mulai, mis. "16.00". */
  jam: string
  /** Tanggal lengkap, mis. "Sabtu, 30 Agustus" — penjelas di bawah `hari`. */
  tanggal: string
  /** Sesi ini terjadi hari ini juga. */
  hariIni: boolean
}

const WIB = 'Asia/Jakarta'

/**
 * Kapan sebuah sesi berlangsung, dalam kata-kata yang dipakai orang.
 *
 * "Besok, 16.00" menjawab pertanyaan yang sebenarnya sedang diajukan orang tua
 * di beranda; "Sabtu, 30 Agustus 2026, 16.00" menuntut mereka menghitung
 * sendiri. Nama harinya tetap ikut sebagai baris kedua — "Besok" saja tidak
 * bisa dicocokkan dengan kalender di dinding.
 *
 * SELURUHNYA dibaca dalam WIB, dan itu bukan hiasan: `scheduled_at` bertipe
 * timestamptz sementara server produksi berjalan di UTC, jadi tanpa `timeZone`
 * sesi pukul 19.00 tertulis 12.00 dan sesi larut malam pindah hari. Beranda
 * dulu memformatnya tanpa zona sama sekali.
 *
 * `hariIniWib` diberikan pemanggil (format `YYYY-MM-DD`, lihat `todayWib()`)
 * agar fungsi ini tidak membaca jam sendiri — alasan yang sama dengan
 * `sekarangIso` di atas.
 */
export function labelSesiWib(iso: string, hariIniWib: string): LabelSesi {
  const d = new Date(iso)
  // `en-CA` memberi `YYYY-MM-DD`, satu-satunya locale bawaan yang begitu —
  // pola yang sama dipakai `lib/actions/admin/classes.ts`.
  const tanggalWib = d.toLocaleDateString('en-CA', { timeZone: WIB })
  const selisih = Math.round(
    (Date.parse(`${tanggalWib}T00:00:00Z`) - Date.parse(`${hariIniWib}T00:00:00Z`)) / 86_400_000,
  )

  const tanggal = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: WIB,
  })

  return {
    // Lebih dari lusa, sebutan relatif berhenti membantu: "4 hari lagi" masih
    // harus diterjemahkan ke tanggal, sementara "Sabtu" langsung dikenali.
    hari: selisih === 0 ? 'Hari ini' : selisih === 1 ? 'Besok' : selisih === 2 ? 'Lusa' : tanggal,
    jam: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: WIB }),
    tanggal,
    hariIni: selisih === 0,
  }
}

/**
 * Tanggal dan jam sebuah kejadian dalam WIB, mis. "28 Agustus 2026, 15.26".
 *
 * Alasannya sama dengan `labelSesiWib` di atas: kolom timestamptz dibaca di
 * server yang berjalan pada UTC, jadi tanpa `timeZone` sebuah latihan pukul
 * 19.00 tertulis 12.00 dan latihan larut malam pindah hari. Tidak memakai
 * sebutan relatif ("Hari ini") karena yang dibaca di sini RIWAYAT — deretan
 * kejadian yang justru dibandingkan satu sama lain, dan "Hari ini" di antara
 * tanggal-tanggal membuat urutannya harus diterjemahkan dulu.
 */
export function waktuWib(iso: string): string {
  const d = new Date(iso)
  const tanggal = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: WIB,
  })
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: WIB })
  return `${tanggal}, ${jam}`
}

