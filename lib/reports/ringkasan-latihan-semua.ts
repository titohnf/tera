import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'
import { bacaKemajuanTopik, kemajuanTopik, type KemajuanTopik } from '@/lib/belajar/sesi'
import {
  bacaKemajuanPeta,
  kemajuanTopikPeta,
  type KemajuanTopikPeta,
} from '@/lib/belajar/topik-rapor'
import { kesetaraanBanyak, type Kesetaraan } from '@/lib/reports/kesetaraan-kelas'
import {
  ketuntasanPeta,
  mandiriPerMapel,
  petaMapelGrup,
  type RangkumanKetuntasan,
  type RangkumanMandiri,
} from '@/lib/reports/ringkasan-laporan'

/**
 * Ringkasan Latihan Mandiri dan Ketuntasan Materi untuk BANYAK siswa sekaligus,
 * bahan tabel di menu admin.
 *
 * Tidak ada aturan baru di sini. Tiap siswa dihitung lewat fungsi yang sama
 * dengan halaman rapor keluarga (`mandiriPerMapel`, `ketuntasanPeta`) atas baris
 * dari fungsi database yang sama (`practice_topic_progress`, `topik_kemajuan`),
 * jadi angka di tabel tidak bisa berbeda dengan angka di halaman rincian atau
 * yang dibaca orang tua.
 *
 * DUA JALUR mengambil barisnya:
 *
 * - **Massal** (migrasi 209): tiga panggilan RPC untuk seluruh siswa. Fungsi
 *   database menjalankan fungsi per-pelajar yang sama di dalam satu pernyataan
 *   SQL, jadi yang dipangkas hanya perjalanan jaringannya.
 * - **Per siswa**: dua RPC per siswa, dibatasi paralelnya. Dipakai HANYA kalau
 *   jalur massal gagal — yaitu selama migrasi 209 belum dijalankan — supaya
 *   halaman tidak kosong di antara deploy dan migrasi.
 */

export type RingkasanLatihanSiswa = {
  /** Null kalau pembacaannya gagal — beda dengan "belum mengerjakan apa pun". */
  mandiri: { mapel: RangkumanMandiri[]; dikerjakan: number; selesai: number } | null
  ketuntasan: RangkumanKetuntasan | null
  /** "Kelas X, setara kelas Y" (migrasi 181); hanya diisi bila diminta. Null = belum dibaca atau gagal dibaca. */
  kesetaraan: Kesetaraan | null
  /** Jawaban terakhir di menu Belajar, ISO; null kalau belum pernah menjawab. */
  terakhirLatihan: string | null
  /** Jawaban terakhir di Misi (paket peta, pengecekan ulang, pemanasan), ISO; null kalau belum pernah menjawab. */
  terakhirMisi: string | null
  gagal: boolean
}

const PARALEL = 8
const POTONGAN = 200

async function denganBatas<T, R>(items: T[], batas: number, kerja: (x: T) => Promise<R>): Promise<R[]> {
  const hasil: R[] = new Array(items.length)
  let berikut = 0
  await Promise.all(
    Array.from({ length: Math.min(batas, items.length) }, async () => {
      while (berikut < items.length) {
        const i = berikut++
        hasil[i] = await kerja(items[i])
      }
    }),
  )
  return hasil
}

type Mentah = {
  mentah: KemajuanTopik[] | null
  peta: KemajuanTopikPeta[] | null
  terakhirLatihan: string | null
  terakhirMisi: string | null
}

/** Jalur massal. Null kalau salah satu RPC gagal (mis. migrasi 209 belum jalan). */
async function ambilMassal(learnerIds: string[]): Promise<Map<string, Mentah> | null> {
  const supabase = await createClient()
  const per = new Map<string, Mentah>()
  const ambil = (id: string) => {
    const ada = per.get(id) ?? { mentah: [], peta: [], terakhirLatihan: null, terakhirMisi: null }
    per.set(id, ada)
    return ada
  }

  type BarisJson = { learner_id: string; baris: unknown }
  type BarisTerakhir = { learner_id: string; terakhir_latihan: string | null; terakhir_misi: string | null }

  for (let i = 0; i < learnerIds.length; i += POTONGAN) {
    const ids = learnerIds.slice(i, i + POTONGAN)
    const [a, b, c] = await Promise.all([
      supabase.rpc('kemajuan_latihan_banyak', { p_learner_ids: ids }),
      supabase.rpc('kemajuan_peta_banyak', { p_learner_ids: ids }),
      supabase.rpc('terakhir_per_jenis_banyak', { p_learner_ids: ids }),
    ])
    if (a.error || b.error || c.error) {
      // Objek galat Supabase tidak ikut terserialisasi oleh console (tercetak
      // `{}`), jadi kolomnya ditulis satu per satu.
      const rinci = (nama: string, e: { message: string; code?: string; details?: string; hint?: string } | null) =>
        e ? `${nama}: [${e.code ?? '?'}] ${e.message}${e.details ? ` — ${e.details}` : ''}${e.hint ? ` (${e.hint})` : ''}` : null
      console.error(
        '[laporan] jalur massal gagal, memakai jalur per siswa:',
        [rinci('kemajuan_latihan_banyak', a.error), rinci('kemajuan_peta_banyak', b.error), rinci('terakhir_per_jenis_banyak', c.error)]
          .filter(Boolean)
          .join(' | '),
      )
      return null
    }
    for (const r of (a.data as BarisJson[] | null) ?? []) ambil(r.learner_id).mentah = bacaKemajuanTopik(r.baris)
    for (const r of (b.data as BarisJson[] | null) ?? []) ambil(r.learner_id).peta = bacaKemajuanPeta(r.baris)
    for (const r of (c.data as BarisTerakhir[] | null) ?? []) {
      const d = ambil(r.learner_id)
      d.terakhirLatihan = r.terakhir_latihan
      d.terakhirMisi = r.terakhir_misi
    }
  }
  return per
}

/** Jalur lama: dua RPC per siswa yang pernah berlatih. */
async function ambilPerSiswa(learnerIds: string[]): Promise<Map<string, Mentah>> {
  const admin = createAdminClient()
  const per = new Map<string, Mentah>()

  // Baris `learners` ada untuk siswa yang cuma pernah membuka menu Belajar,
  // jadi punya baris belum berarti pernah berlatih. Satu pemeriksaan murah di
  // `practice_sessions` membuang mereka sebelum RPC-nya dijalankan.
  // Sesi Misi = paket peta, pengecekan ulang, atau pemanasan; selebihnya latihan
  // (penggolongan yang sama dengan `terakhir_per_jenis_banyak`, migrasi 210).
  // Yang dihitung JAWABAN terakhir, bukan sesi yang dibuka: sesi kosong tidak
  // boleh membuat siswa tampil baru berlatih.
  const latihanDari = new Map<string, string>()
  const misiDari = new Map<string, string>()
  const HALAMAN = 1000
  type Sesi = {
    id: string
    learner_id: string
    paket_topik_id: string | null
    probe_topik_id: string | null
    probe_pemanasan: boolean | null
  }
  type Jawab = { learner_id: string; session_id: string; answered_at: string }
  for (let i = 0; i < learnerIds.length; i += 100) {
    const potong = learnerIds.slice(i, i + 100)
    const misiSesi = new Map<string, boolean>()
    for (let dari = 0; ; dari += HALAMAN) {
      const { data } = await admin
        .from('practice_sessions')
        .select('id, learner_id, paket_topik_id, probe_topik_id, probe_pemanasan')
        .in('learner_id', potong)
        .range(dari, dari + HALAMAN - 1)
      const rows = (data as Sesi[] | null) ?? []
      for (const r of rows) misiSesi.set(r.id, !!(r.paket_topik_id || r.probe_topik_id || r.probe_pemanasan))
      if (rows.length < HALAMAN) break
    }
    for (let dari = 0; ; dari += HALAMAN) {
      const { data } = await admin
        .from('practice_answers')
        .select('learner_id, session_id, answered_at')
        .in('learner_id', potong)
        .order('answered_at', { ascending: false })
        .range(dari, dari + HALAMAN - 1)
      const rows = (data as Jawab[] | null) ?? []
      for (const r of rows) {
        const peta = misiSesi.get(r.session_id) ? misiDari : latihanDari
        const lama = peta.get(r.learner_id)
        if (!lama || r.answered_at > lama) peta.set(r.learner_id, r.answered_at)
      }
      if (rows.length < HALAMAN) break
    }
  }

  const ada = learnerIds.filter(id => latihanDari.has(id) || misiDari.has(id))
  await denganBatas(ada, PARALEL, async learnerId => {
    const [mentah, peta] = await Promise.all([kemajuanTopik(learnerId), kemajuanTopikPeta(learnerId)])
    per.set(learnerId, {
      mentah,
      peta,
      terakhirLatihan: latihanDari.get(learnerId) ?? null,
      terakhirMisi: misiDari.get(learnerId) ?? null,
    })
  })
  return per
}

export async function ringkasanLatihanSemua(
  studentIds: string[],
  opsi: { kesetaraan?: boolean } = {},
): Promise<Map<string, RingkasanLatihanSiswa>> {
  const admin = createAdminClient()
  const out = new Map<string, RingkasanLatihanSiswa>()
  const kosong: RingkasanLatihanSiswa = {
    mandiri: { mapel: [], dikerjakan: 0, selesai: 0 },
    ketuntasan: null,
    kesetaraan: null,
    terakhirLatihan: null,
    terakhirMisi: null,
    gagal: false,
  }
  for (const id of studentIds) out.set(id, kosong)
  if (studentIds.length === 0) return out

  // Hanya membaca `learners`; tidak melahirkan baris untuk siswa yang belum berlatih.
  const learnerDari = new Map<string, string>()
  for (let i = 0; i < studentIds.length; i += 100) {
    const { data } = await admin
      .from('learners')
      .select('id, profile_id')
      .in('profile_id', studentIds.slice(i, i + 100))
    for (const l of (data as { id: string; profile_id: string }[] | null) ?? []) {
      learnerDari.set(l.profile_id, l.id)
    }
  }
  const learnerIds = [...learnerDari.values()]
  if (learnerIds.length === 0) return out

  const [massal, grup] = await Promise.all([ambilMassal(learnerIds), petaMapelGrup()])
  const data = massal ?? (await ambilPerSiswa(learnerIds))

  // Hanya pelajar yang pernah menjawab: yang lain tidak punya topik tuntas, jadi
  // tidak ada klaim yang bisa dibuat dan menghitungnya cuma membuang waktu.
  const kesetaraan = opsi.kesetaraan ? await kesetaraanBanyak([...data.keys()]) : null

  for (const [studentId, learnerId] of learnerDari) {
    const d = data.get(learnerId)
    // Tidak ada baris sama sekali = belum pernah berlatih.
    if (!d) continue
    const mapel = d.mentah === null ? null : await mandiriPerMapel(d.mentah, grup)
    out.set(studentId, {
      mandiri:
        d.mentah === null || mapel === null
          ? null
          : {
              mapel,
              dikerjakan: d.mentah.filter(k => k.answered > 0).length,
              selesai: mapel.reduce((n, m) => n + m.selesai, 0),
            },
      ketuntasan: (() => {
        if (d.peta === null) return null
        const k = ketuntasanPeta(d.peta)
        if (k === null) return null
        const ks = kesetaraan?.get(learnerId) ?? null
        // Cacah topik tuntas ikut dari sumber yang sama dengan klaim kesetaraan.
        return ks ? { ...k, tuntas: ks.tuntas, topik: ks.total } : k
      })(),
      kesetaraan: kesetaraan?.get(learnerId) ?? null,
      terakhirLatihan: d.terakhirLatihan,
      terakhirMisi: d.terakhirMisi,
      gagal: d.mentah === null || d.peta === null,
    })
  }

  return out
}
