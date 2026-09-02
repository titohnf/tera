import { createClient } from '@/lib/supabase/server'

/**
 * Bacaan tutor atas pengukuran Tahap 0 — roster, rapor per murid, eskalasi.
 *
 * Seluruhnya lewat RPC `tutor_*` (migrasi 150), tidak satu pun lewat tabel.
 * Bukan gaya: tabel yang dibutuhkan halaman ini memang tertutup bagi tutor —
 * `learners` sejak 061, `paket_topik` sejak 145, dan Skor Putaran 1 dicabut
 * haknya di 149 justru supaya tidak pernah sampai ke murid. Membuka ketiganya
 * lewat kebijakan RLS akan memberi tutor jauh lebih banyak dari yang halaman
 * ini butuh; RPC memberi jawaban, bukan akses.
 *
 * Konsekuensinya: tidak ada keputusan siapa-boleh-lihat-apa di berkas ini.
 * Kalau sebuah baris pulang, database sudah memutuskan pemanggilnya berhak.
 *
 * SATU HAL YANG TIDAK BOLEH BOCOR KE BAWAH. `skorPutaran1` cuma untuk permukaan
 * tutor (FR3: murid tidak boleh melihatnya "dalam bentuk apa pun"). Komponen
 * mana pun yang ikut dipakai halaman murid tidak boleh menerima tipe dari
 * berkas ini.
 */

const angka = (n: number | string | null | undefined) => Number(n ?? 0)
/** Numerik yang boleh kosong: `null` berarti belum ada datanya, bukan nol. */
const angkaAtauNull = (n: number | string | null | undefined) =>
  n === null || n === undefined ? null : Number(n)

/** Satu murid yang jadi tanggung jawab tutor ini. */
export interface MuridPengukuran {
  learnerId: string
  nama: string
  eskalasiTerbuka: number
  eskalasiTerakhir: string | null
  paketSelesai: number
}

/** Satu paket dalam rapor pengukuran seorang murid. */
export interface PaketPengukuran {
  topikId: string
  topikNama: string
  paketId: string
  jenis: 'latihan' | 'ujian'
  levelBloom: number | null
  nomor: number
  /** Banyaknya sesi yang sudah dijalani untuk paket ini; 0 = belum disentuh. */
  putaran: number
  putaran1Selesai: boolean
  butirPaket: number
  butirTerjawabPutaran1: number
  /** 0–1. Null kalau belum ada jawaban sama sekali. TIDAK untuk mata murid. */
  skorPutaran1: number | null
  /** 0–1. Null kalau belum ada jawaban sama sekali. */
  skorAkhir: number | null
  /**
   * Rata-rata waktu efektif per butir, detik — sudah dikurangi jeda (FR6).
   *
   * Null untuk paket yang butirnya dijawab sebelum waktu mulai dicatat. Ini
   * angka yang diminta Protokol Uji Coba Bagian 6 untuk memproyeksikan beban
   * produksi konten, bukan angka untuk menilai cepat-lambatnya anak.
   */
  detikPerButir: number | null
  /**
   * Butir yang berakhir "menyerah, lihat kunci" (FR3).
   *
   * Diturunkan, bukan dicatat: butir yang belum penuh nilainya saat kunci paket
   * dibuka. Dibedakan dari butir yang dijawab salah karena keduanya kabar yang
   * berbeda — yang satu berhenti mencoba, yang lain masih mencoba.
   */
  butirMenyerah: number
}

/** Satu eskalasi beserta status SLA-nya. */
export interface Eskalasi {
  id: string
  learnerId: string
  nama: string
  labelPemicu: string | null
  ambangBerlaku: number | null
  skorPemicu: number[]
  waktuTerkirim: string
  waktuDirespons: string | null
  catatan: string | null
  statusSla: 'menunggu' | 'terpenuhi' | 'terlambat'
}

interface BarisMurid {
  learner_id: string
  nama: string
  eskalasi_terbuka: number | string
  eskalasi_terakhir: string | null
  paket_selesai: number | string
}

interface BarisPaket {
  topik_id: string
  topik_nama: string
  paket_id: string
  jenis: 'latihan' | 'ujian'
  level_bloom: number | null
  nomor: number | string
  putaran: number | string
  putaran_1_selesai: boolean
  butir_paket: number | string
  butir_terjawab_putaran_1: number | string
  skor_putaran_1: number | string | null
  skor_akhir: number | string | null
  detik_per_butir: number | string | null
  butir_menyerah: number | string | null
}

interface BarisEskalasi {
  id: string
  learner_id: string
  nama: string
  label_pemicu: string | null
  ambang_berlaku: number | string | null
  skor_pemicu: (number | string)[] | null
  waktu_notifikasi_terkirim: string
  waktu_tutor_merespons: string | null
  catatan_tindak_lanjut: string | null
  status_sla: Eskalasi['statusSla']
}

/** Murid pilot yang jadi tanggung jawab tutor yang sedang masuk. */
export async function muridPengukuran(): Promise<MuridPengukuran[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('tutor_murid_pengukuran')
  if (error) {
    console.error('[pengukuran] gagal memuat murid:', error)
    return []
  }

  return ((data as BarisMurid[] | null) ?? []).map(b => ({
    learnerId: b.learner_id,
    nama: b.nama,
    eskalasiTerbuka: angka(b.eskalasi_terbuka),
    eskalasiTerakhir: b.eskalasi_terakhir,
    paketSelesai: angka(b.paket_selesai),
  }))
}

/** Rapor pengukuran seorang murid: satu baris per paket. */
export async function paketPengukuran(learnerId: string): Promise<PaketPengukuran[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('tutor_pengukuran_paket', {
    p_learner_id: learnerId,
  })
  if (error) {
    console.error('[pengukuran] gagal memuat paket:', error)
    return []
  }

  return ((data as BarisPaket[] | null) ?? []).map(b => ({
    topikId: b.topik_id,
    topikNama: b.topik_nama,
    paketId: b.paket_id,
    jenis: b.jenis,
    levelBloom: b.level_bloom,
    nomor: angka(b.nomor),
    putaran: angka(b.putaran),
    putaran1Selesai: b.putaran_1_selesai,
    butirPaket: angka(b.butir_paket),
    butirTerjawabPutaran1: angka(b.butir_terjawab_putaran_1),
    skorPutaran1: angkaAtauNull(b.skor_putaran_1),
    skorAkhir: angkaAtauNull(b.skor_akhir),
    detikPerButir: angkaAtauNull(b.detik_per_butir),
    butirMenyerah: angka(b.butir_menyerah),
  }))
}

/** Eskalasi yang jadi tanggung jawab tutor ini. */
export async function daftarEskalasi(belumDijawab = false): Promise<Eskalasi[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('tutor_eskalasi', {
    p_belum_dijawab: belumDijawab,
  })
  if (error) {
    console.error('[pengukuran] gagal memuat eskalasi:', error)
    return []
  }

  return ((data as BarisEskalasi[] | null) ?? []).map(b => ({
    id: b.id,
    learnerId: b.learner_id,
    nama: b.nama,
    labelPemicu: b.label_pemicu,
    ambangBerlaku: angkaAtauNull(b.ambang_berlaku),
    skorPemicu: (b.skor_pemicu ?? []).map(n => Number(n)),
    waktuTerkirim: b.waktu_notifikasi_terkirim,
    waktuDirespons: b.waktu_tutor_merespons,
    catatan: b.catatan_tindak_lanjut,
    statusSla: b.status_sla,
  }))
}

/** Status mesin keadaan sebuah topik untuk seorang murid (FR13). */
export interface StatusTopik {
  topikId: string
  nama: string
  status:
    | 'terkunci'
    | 'siap_dikerjakan'
    | 'sedang_dikerjakan'
    | 'tuntas'
    | 'butuh_pengulangan'
    | 'eskalasi_tutor'
  perluVerifikasiUlang: boolean
  sejak: string
}

/**
 * Status topik seorang murid, dari cetakan yang ditulis `evaluasi_unlock`
 * (migrasi 163).
 *
 * DIBACA LANGSUNG DARI TABEL, bukan lewat RPC seperti tetangganya di berkas
 * ini. Alasannya: yang menjaga tabel ini adalah kebijakan RLS-nya sendiri —
 * tutor penanggung jawab ada di dalamnya — jadi tidak ada gerbang yang perlu
 * dipusatkan di sebuah fungsi. Yang lain memakai RPC karena `learners` memang
 * tertutup bagi tutor; di sini tidak ada tabel tertutup yang perlu disatukan.
 *
 * Murid yang belum pernah menyelesaikan satu sesi pun belum punya baris sama
 * sekali, dan daftar kosong adalah jawaban yang benar untuk itu — bukan enam
 * belas baris `terkunci` yang tidak mengatakan apa-apa.
 */
export async function statusTopikMurid(learnerId: string): Promise<StatusTopik[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('status_topik_siswa')
    .select('topik_id, status, perlu_verifikasi_ulang, waktu_perubahan_status, topik(nama)')
    .eq('learner_id', learnerId)
    .order('topik_id')
  if (error) {
    console.error('[pengukuran] gagal memuat status topik:', error)
    return []
  }

  return ((data ?? []) as unknown as {
    topik_id: string
    status: StatusTopik['status']
    perlu_verifikasi_ulang: boolean
    waktu_perubahan_status: string
    topik: { nama: string } | null
  }[]).map(b => ({
    topikId: b.topik_id,
    nama: b.topik?.nama ?? b.topik_id,
    status: b.status,
    perluVerifikasiUlang: b.perlu_verifikasi_ulang,
    sejak: b.waktu_perubahan_status,
  }))
}
