import { createAdminClient } from '@/lib/supabase/server-admin'
import { kemajuanTopik } from '@/lib/belajar/sesi'
import { kemajuanTopikPeta } from '@/lib/belajar/topik-rapor'
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
 * dengan halaman rapor keluarga (`kemajuanTopik` + `mandiriPerMapel`,
 * `kemajuanTopikPeta` + `ketuntasanPeta`), jadi angka di tabel tidak bisa
 * berbeda dengan angka di halaman rincian atau yang dibaca orang tua.
 *
 * Ongkosnya: dua panggilan RPC per siswa yang punya baris `learners`. Dibatasi
 * paralelnya supaya tidak menyerbu database, dan siswa yang belum pernah
 * berlatih tidak memanggil apa pun.
 */

export type RingkasanLatihanSiswa = {
  /** Null kalau pembacaannya gagal — beda dengan "belum mengerjakan apa pun". */
  mandiri: { mapel: RangkumanMandiri[]; dikerjakan: number; selesai: number } | null
  ketuntasan: RangkumanKetuntasan | null
  gagal: boolean
}

const PARALEL = 8

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

export async function ringkasanLatihanSemua(
  studentIds: string[],
): Promise<Map<string, RingkasanLatihanSiswa>> {
  const admin = createAdminClient()
  const out = new Map<string, RingkasanLatihanSiswa>()
  const kosong: RingkasanLatihanSiswa = { mandiri: { mapel: [], dikerjakan: 0, selesai: 0 }, ketuntasan: null, gagal: false }
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

  // Baris `learners` ada untuk siswa yang cuma pernah membuka menu Belajar,
  // jadi punya baris belum berarti pernah berlatih. Satu pemeriksaan murah di
  // `practice_sessions` (jauh lebih sedikit barisnya daripada jawaban) membuang
  // mereka sebelum dua RPC per siswa dijalankan — itulah yang mahal.
  const learnerIds = [...learnerDari.values()]
  const pernahBerlatih = new Set<string>()
  const HALAMAN = 1000
  for (let i = 0; i < learnerIds.length; i += 100) {
    const potong = learnerIds.slice(i, i + 100)
    for (let dari = 0; ; dari += HALAMAN) {
      const { data } = await admin
        .from('practice_sessions')
        .select('learner_id')
        .in('learner_id', potong)
        .range(dari, dari + HALAMAN - 1)
      const rows = (data as { learner_id: string }[] | null) ?? []
      for (const r of rows) pernahBerlatih.add(r.learner_id)
      if (rows.length < HALAMAN) break
    }
  }

  const ada = studentIds.filter(id => {
    const l = learnerDari.get(id)
    return l !== undefined && pernahBerlatih.has(l)
  })
  if (ada.length === 0) return out

  const grup = await petaMapelGrup()

  await denganBatas(ada, PARALEL, async studentId => {
    const learnerId = learnerDari.get(studentId)!
    const [mentah, peta] = await Promise.all([kemajuanTopik(learnerId), kemajuanTopikPeta(learnerId)])
    const mapel = mentah === null ? null : await mandiriPerMapel(mentah, grup)
    out.set(studentId, {
      mandiri:
        mentah === null || mapel === null
          ? null
          : {
              mapel,
              dikerjakan: mentah.filter(k => k.answered > 0).length,
              selesai: mapel.reduce((n, m) => n + m.selesai, 0),
            },
      ketuntasan: peta === null ? null : ketuntasanPeta(peta),
      gagal: mentah === null || peta === null,
    })
  })

  return out
}
