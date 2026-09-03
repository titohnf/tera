import { createClient } from '@/lib/supabase/server'

/**
 * Jalur peta kompetensi — kembaran `sesi.ts` yang berkunci topik, bukan grup
 * kurikulum.
 *
 * Kenapa berkas sendiri dan bukan cabang di dalam `sesi.ts`: berkas itu sudah
 * memikul seluruh jalur grup, dan menambahkan mode kedua di dalamnya berarti
 * tiap fungsi harus menjawab "ini yang mana" sebelum menjawab pertanyaannya
 * sendiri. Keduanya memang berbeda sampai ke pangkalnya — yang satu bertanya
 * "apa isi bab ini", yang lain "apa yang sudah dikuasai anak ini" — dan
 * kemiripan bentuk keluarannya kebetulan, bukan alasan menyatukannya.
 *
 * Seluruh fungsi di sini memanggil RPC `topik_*` (migrasi 146) yang
 * gerbangnya `practice_actor()` dan `practice_only_public()` di sisi database.
 * Tidak ada keputusan akses yang diambil di berkas ini.
 */

const TANPA_KODE = ''


/** Satu topik di peta, beserta kesiapannya untuk anak ini. */
export interface TopikPeta {
  id: string
  nama: string
  elemen: string
  jenjangKelas: string
  /** Titik lemah nasional: `ekstra` atau `ekstra_wajib`, selain itu `biasa`. */
  penandaRemediasi: string
  jumlahPaket: number
  /**
   * Seluruh prasyaratnya sudah tuntas.
   *
   * MEMBERI TAHU, BUKAN MEMBLOKIR. Tanpa placement test, anak kelas 8 yang
   * belum pernah menyentuh D-02 tidak boleh terkunci dari D-08 hanya karena
   * sistem belum sempat mengukurnya. Layar memakainya untuk menyusun urutan
   * dan memberi keterangan, bukan mematikan tombol.
   */
  prasyaratTerpenuhi: boolean
  prasyaratKurang: string[]
  /**
   * Status enam keadaan topik ini (FR13), dari cetakan `status_topik_siswa`.
   *
   * Null untuk topik yang belum punya baris cetakan — cetakannya baru ditulis
   * `evaluasi_unlock` di akhir sesi, jadi anak yang belum pernah mengerjakan
   * apa pun memang belum punya status yang layak ditampilkan. Null berarti
   * "belum ada yang bisa dikatakan", bukan "terkunci".
   */
  status: string | null
  /**
   * Tes penempatan topik ini masih boleh dibuka (Dokumen Fondasi Bagian 3.1):
   * belum pernah dites, kolamnya lengkap, dan belum ada paket yang digarap.
   */
  penempatanSiap: boolean
  /**
   * Level Bloom tertinggi yang sudah dibebaskan tes penempatan. 0 berarti tidak
   * ada — entah karena belum dites, atau karena tesnya tidak membebaskan apa pun.
   */
  levelDibebaskan: number
  /**
   * Tanggal pengecekan ulang berikutnya (FR11), untuk topik yang sudah tuntas.
   * Null kalau topiknya belum tuntas atau jadwalnya sudah jatuh tempo — yang
   * jatuh tempo tampil sebagai `KartuRetest` di atas peta, bukan sebagai
   * keterangan di baris topiknya.
   */
  retestBerikutnya: string | null
}

/** Satu paket di dalam sebuah topik. */
export interface PaketPeta {
  paketId: string
  jenis: 'latihan' | 'ujian'
  /** Level Bloom paket latihan; null untuk paket ujian, yang mencampur level. */
  levelBloom: number | null
  nomor: number
  total: number
  benar: number
  sebagian: number
  salah: number
  belum: number
  skor: number
  maks: number
  putaran: number
  terkunci: boolean
  /**
   * Kapan paket yang sedang terkunci terbuka lagi (ISO), atau null.
   *
   * Null punya dua arti yang sengaja tidak dibedakan di sini: paketnya memang
   * tidak terkunci, atau ia paket ujian yang kuncinya permanen. Yang memakainya
   * cuma menampilkan waktunya kalau ada — dan untuk ujian memang tidak ada
   * waktu yang boleh dijanjikan.
   */
  bukaPada: string | null
}

interface BarisTopik {
  topik_id: string
  nama: string
  elemen: string
  jenjang_kelas: string
  penanda_remediasi: string
  jumlah_paket: number | string
  prasyarat_terpenuhi: boolean
  prasyarat_kurang: string[] | null
}

interface BarisPaket {
  paket_id: string
  jenis: 'latihan' | 'ujian'
  level_bloom: number | null
  nomor: number
  jumlah: number | string
  benar: number | string
  sebagian: number | string
  salah: number | string
  belum: number | string
  skor: number | string
  maks: number | string
  putaran: number | string
  terkunci: boolean | null
  buka_pada: string | null
}

const angka = (n: number | string | null | undefined) => Number(n ?? 0)

/**
 * Topik yang boleh dikerjakan anak ini.
 *
 * Yang pulang hanya topik `aktif` yang punya paket berisi — syarat kedua itu
 * yang mencegah peta menyala sebagai satu kotak berisi dan delapan belas kotak
 * abu-abu, keadaan yang membuat anak mengira aplikasinya rusak padahal isinya
 * memang belum ditulis.
 */
export async function petaTopik(learnerId: string): Promise<TopikPeta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_tersedia', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal memuat topik:', error)
    return []
  }

  // Status dan jadwal dijemput di sini, bukan dibiarkan diminta komponennya
  // sendiri sesudah hidup: peta ini dirender di server, dan menyerahkan dua
  // pertanyaan kecil ke browser berarti barisnya muncul dulu tanpa label lalu
  // berkedip berisi. Keduanya tabel biasa dengan RLS yang sudah mengizinkan
  // keluarga membacanya (migrasi 163 dan 164), jadi tidak ada RPC baru.
  //
  // Gagalnya salah satu bukan alasan menggagalkan petanya: yang hilang cuma
  // keterangan, sedangkan daftar topiknya sendiri sudah lengkap di tangan.
  const [cetakan, jadwal, penempatan, kolam] = await Promise.all([
    supabase.from('status_topik_siswa').select('topik_id, status').eq('learner_id', learnerId),
    supabase
      .from('jadwal_retest')
      .select('topik_id, tanggal_retest_berikutnya')
      .eq('learner_id', learnerId),
    supabase
      .from('penempatan_topik')
      .select('topik_id, level_tertinggi_lolos')
      .eq('learner_id', learnerId),
    // Topik yang tes penempatannya boleh ditawarkan. DITANYAKAN, bukan
    // dihitung ulang di sini: syaratnya tinggal di `penempatan_buka_sesi`, dan
    // menyusunnya kembali di TypeScript berarti dua salinan aturan yang harus
    // berubah bersama. Versi pertama berkas ini melakukannya, dan tidak pernah
    // bekerja sama sekali — ia membaca `question_bank_items` langsung,
    // sedangkan hak baca tabel itu cuma milik admin.
    supabase.rpc('penempatan_ditawarkan', {
      p_access_code: TANPA_KODE,
      p_learner_id: learnerId,
    }),
  ])
  if (cetakan.error) console.error('[peta] gagal membaca status topik:', cetakan.error)
  if (jadwal.error) console.error('[peta] gagal membaca jadwal retest:', jadwal.error)
  if (penempatan.error) console.error('[peta] gagal membaca hasil penempatan:', penempatan.error)
  if (kolam.error) console.error('[peta] gagal membaca tawaran penempatan:', kolam.error)

  const statusTopik = new Map(
    (cetakan.data ?? []).map(b => [b.topik_id as string, b.status as string])
  )
  const hariIni = new Date().toISOString().slice(0, 10)
  const retestTopik = new Map(
    (jadwal.data ?? [])
      .filter(b => (b.tanggal_retest_berikutnya as string) > hariIni)
      .map(b => [b.topik_id as string, b.tanggal_retest_berikutnya as string])
  )

  const dibebaskan = new Map(
    (penempatan.data ?? []).map(b => [b.topik_id as string, Number(b.level_tertinggi_lolos)])
  )
  const ditawarkan = new Set(
    ((kolam.data as { topik_id: string }[] | null) ?? []).map(b => b.topik_id)
  )

  return ((data as BarisTopik[] | null) ?? []).map(b => ({
    id: b.topik_id,
    nama: b.nama,
    elemen: b.elemen,
    jenjangKelas: b.jenjang_kelas,
    penandaRemediasi: b.penanda_remediasi,
    jumlahPaket: angka(b.jumlah_paket),
    prasyaratTerpenuhi: b.prasyarat_terpenuhi,
    prasyaratKurang: b.prasyarat_kurang ?? [],
    status: statusTopik.get(b.topik_id) ?? null,
    retestBerikutnya: retestTopik.get(b.topik_id) ?? null,
    penempatanSiap: ditawarkan.has(b.topik_id),
    levelDibebaskan: dibebaskan.get(b.topik_id) ?? 0,
  }))
}

/** Keadaan tiap paket sebuah topik untuk anak ini. */
export async function keadaanPaketTopik(
  learnerId: string,
  topikId: string
): Promise<PaketPeta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_paket_state', {
    p_topik_id: topikId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal memuat paket:', error)
    return []
  }

  return ((data as BarisPaket[] | null) ?? []).map(b => ({
    paketId: b.paket_id,
    jenis: b.jenis,
    levelBloom: b.level_bloom,
    nomor: b.nomor,
    total: angka(b.jumlah),
    benar: angka(b.benar),
    sebagian: angka(b.sebagian),
    salah: angka(b.salah),
    belum: angka(b.belum),
    skor: angka(b.skor),
    maks: angka(b.maks),
    putaran: angka(b.putaran),
    terkunci: Boolean(b.terkunci),
    bukaPada: b.buka_pada ?? null,
  }))
}

/**
 * Membuka satu putaran sebuah paket. Null berarti tidak bisa dibuka, dan
 * pemanggilnya tidak perlu membedakan sebabnya di layar: paketnya terkunci,
 * sudah benar semua, paket ujian yang sudah pernah dikerjakan, atau bukan
 * miliknya.
 */
/**
 * Hasil membuka paket: id sesinya, atau alasan yang bisa dibaca orang.
 *
 * Keduanya bisa kosong sekaligus — itu keadaan "tidak bisa dibuka" yang biasa
 * (sudah benar semua, kuncinya sudah dibuka, ujiannya sudah dikerjakan), dan
 * pemanggilnya yang tahu kalimat apa yang pantas untuk itu.
 */
export interface HasilBukaPaket {
  sesiId: string | null
  galat: string | null
}

export async function bukaPaketTopik(
  learnerId: string,
  paketId: string
): Promise<HasilBukaPaket> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_open_paket_session', {
    p_paket_id: paketId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })

  if (error) {
    console.error('[peta] gagal membuka paket:', error)
    // 23514 = check_violation, kode yang dipakai gerbang-gerbang kita sendiri
    // (penanggung jawab pengukuran di migrasi 149, peruntukan butir di 145).
    // Pesannya memang ditulis untuk dibaca manusia, dan MENYEMBUNYIKANNYA di
    // balik kalimat umum adalah cara paling mahal menghabiskan waktu orang:
    // layar berkata "paket ini sudah selesai" untuk paket yang belum pernah
    // disentuh, dan tidak ada satu pun petunjuk menuju sebabnya yang sebenarnya.
    //
    // Galat lain tidak diteruskan apa adanya — isinya nama kolom dan potongan
    // SQL, yang bukan kalimat untuk anak.
    return {
      sesiId: null,
      galat:
        error.code === '23514'
          ? error.message
          : 'Paketnya gagal dibuka karena gangguan sistem. Coba lagi sebentar.',
    }
  }

  return { sesiId: (data as string | null) ?? null, galat: null }
}

/** Paket peta sebuah sesi, atau null kalau sesi itu jalur grup. */
export interface PaketSesiPeta {
  paketId: string
  topikId: string
  topikNama: string
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
}

/**
 * Sesi ini paket peta yang mana.
 *
 * Dipakai halaman hasil untuk memilih jalur: `paketSesi()` di `sesi.ts`
 * menjawab pertanyaan yang sama untuk jalur grup, dan keduanya tidak pernah
 * terisi bersamaan.
 */
export async function paketTopikSesi(sesiId: string): Promise<PaketSesiPeta | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('sesi_paket_topik', {
    p_session_id: sesiId,
    p_access_code: TANPA_KODE,
  })
  if (error) {
    console.error('[peta] gagal membaca paket sesi:', error)
    return null
  }

  const b = (data as
    | {
        paket_id: string
        topik_id: string
        topik_nama: string
        jenis: 'latihan' | 'ujian'
        level_bloom: number | null
        nomor: number | string
      }[]
    | null)?.[0]
  if (!b) return null

  return {
    paketId: b.paket_id,
    topikId: b.topik_id,
    topikNama: b.topik_nama,
    jenis: b.jenis,
    levelBloom: b.level_bloom,
    nomor: angka(b.nomor),
  }
}

/** Isi sebuah paket peta beserta urutannya — untuk menomori soal di layar hasil. */
export async function isiPaketTopik(
  learnerId: string,
  paketId: string
): Promise<{ itemId: string; ord: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_paket_items', {
    p_paket_id: paketId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal membaca isi paket:', error)
    return []
  }
  return ((data as { item_id: string; ord: number | string }[] | null) ?? []).map(b => ({
    itemId: b.item_id,
    ord: angka(b.ord),
  }))
}

/** Membuka kunci jawaban sebuah paket — sesudah ini nilainya berhenti di situ. */
export async function kunciPaketTopik(learnerId: string, paketId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('topik_lock_paket', {
    p_paket_id: paketId,
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[peta] gagal mengunci paket:', error)
    return false
  }
  return Boolean(data)
}

/**
 * Kalimat pendampingan untuk murid sesudah paket pemicu eskalasi (FR7).
 *
 * Null berarti tidak ada yang perlu dikatakan — dan itu keadaan yang jauh
 * lebih sering. Yang menyeberang dari database cuma kalimatnya: tidak ada
 * skor, tidak ada ambang, tidak ada tanda bahwa sebuah baris eskalasi lahir.
 * Batas itu ditegakkan oleh bentuk `pesan_pendampingan` sendiri (migrasi 162),
 * bukan oleh kesopanan berkas ini.
 *
 * Galat ditelan jadi null dengan sengaja: sebuah kalimat penyemangat yang
 * gagal dimuat tidak boleh menjatuhkan halaman hasil yang membawa nilai anak.
 */
export async function pesanPendampingan(
  learnerId: string,
  sesiId: string,
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('pesan_pendampingan', {
    p_access_code: TANPA_KODE,
    p_learner_id: learnerId,
    p_sesi_id: sesiId,
  })
  if (error) {
    console.error('[belajar] gagal membaca pesan pendampingan:', error)
    return null
  }
  return (data as string | null) ?? null
}
