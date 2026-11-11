import { createClient } from '@/lib/supabase/server'

/**
 * "Kelas X, kemampuan setara kelas Y" — dari `rapor_kesetaraan()` (migrasi 181).
 *
 * Aturannya ada di database dan tidak disalin di sini: setara kelas Y menuntut
 * SELURUH topik dengan `kelas_kuasai` <= Y tuntas (kumulatif — satu lubang di
 * kelas 3 membatalkan klaim kelas 7), dan `batas_bukti` adalah kelas tertinggi
 * yang seluruh topiknya sudah punya butir soal, langit-langit setiap klaim.
 *
 * `setara` null artinya klaimnya BELUM BISA DIBUAT, bukan anaknya tidak mampu.
 *
 * ⚠️ Berbeda dari `levelKelas` di `ketuntasanPeta()` (lib/reports/
 * ringkasan-laporan.ts), yang dipakai kartu Ketuntasan di rapor keluarga:
 * itu "jenjang tertinggi yang seluruh topiknya tuntas", TIDAK kumulatif dan
 * memakai `jenjang_kelas`, bukan `kelas_kuasai`. Keduanya bisa menunjuk angka
 * berbeda untuk anak yang sama begitu ada topik yang tuntas.
 */
export type Kesetaraan = {
  terdaftar: number | null
  setara: number | null
  batasBukti: number | null
  tuntas: number
  terukur: number
  total: number
}

type Baris = {
  kelas_terdaftar: number | null
  kelas_setara: number | null
  batas_bukti: number | null
  topik_tuntas: number
  topik_terukur: number
  topik_total: number
}

/** Null kalau pembacaannya gagal — beda dengan "klaim belum bisa dibuat". */
export async function kesetaraanKelas(learnerId: string): Promise<Kesetaraan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('rapor_kesetaraan', { p_learner_id: learnerId })
  if (error) {
    console.error('[laporan] rapor_kesetaraan gagal:', `[${error.code}] ${error.message}`)
    return null
  }
  const b = (data as Baris[] | null)?.[0]
  if (!b) return null
  return {
    terdaftar: b.kelas_terdaftar,
    setara: b.kelas_setara,
    batasBukti: b.batas_bukti,
    tuntas: Number(b.topik_tuntas),
    terukur: Number(b.topik_terukur),
    total: Number(b.topik_total),
  }
}

/**
 * Banyak pelajar sekaligus, dibatasi paralelnya: satu panggilan menghitung
 * status seluruh topik pelajar itu dan memakan satu sampai dua detik.
 */
export async function kesetaraanBanyak(learnerIds: string[], paralel = 6): Promise<Map<string, Kesetaraan | null>> {
  const hasil = new Map<string, Kesetaraan | null>()
  let berikut = 0
  await Promise.all(
    Array.from({ length: Math.min(paralel, learnerIds.length) }, async () => {
      while (berikut < learnerIds.length) {
        const id = learnerIds[berikut++]
        hasil.set(id, await kesetaraanKelas(id))
      }
    }),
  )
  return hasil
}

/** Satu anak tangga: topik yang seharusnya dikuasai di kelas itu (`kelas_kuasai`). */
export type AnakTangga = { kelas: number; total: number; terukur: number; tuntas: number }

/**
 * Tangga kelas 1–12 dari `rapor_cakupan_kelas()` (migrasi 212), hanya kelas yang
 * punya topik. Null kalau gagal dibaca — termasuk selama migrasi 212 belum
 * dijalankan; pemanggil yang menggambar tangga harus menyiapkan jalan lain.
 */
export async function tanggaKelas(learnerId: string): Promise<AnakTangga[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('rapor_cakupan_kelas', { p_learner_id: learnerId })
  if (error) {
    console.error('[laporan] rapor_cakupan_kelas gagal:', `[${error.code}] ${error.message}`)
    return null
  }
  type B = { kelas: number; topik_total: number; topik_terukur: number; topik_tuntas: number }
  return ((data as B[] | null) ?? [])
    .map(b => ({
      kelas: Number(b.kelas),
      total: Number(b.topik_total),
      terukur: Number(b.topik_terukur),
      tuntas: Number(b.topik_tuntas),
    }))
    .filter(a => a.total > 0)
    .sort((a, b) => a.kelas - b.kelas)
}

/** Klaim dan tangganya sekaligus, dibaca berbarengan. Salah satunya bisa null. */
export async function kesetaraanLengkap(
  learnerId: string,
): Promise<{ ks: Kesetaraan | null; tangga: AnakTangga[] | null }> {
  const [ks, tangga] = await Promise.all([kesetaraanKelas(learnerId), tanggaKelas(learnerId)])
  return { ks, tangga }
}
