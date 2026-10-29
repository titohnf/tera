/**
 * Penomoran kurikulum — SATU-SATUNYA tempat nomor "tema.topik.CP" dihitung.
 *
 * Dipakai menu Kurikulum (`CurriculumTable`) dan tabel Materi dan Latihan Soal,
 * supaya nomor yang dibaca admin di dua tempat itu tidak pernah berbeda, dan
 * tabel materi otomatis mengikuti kalau kurikulum diubah: nomornya tidak
 * disimpan di mana pun, selalu dihitung dari baris kurikulum saat ini.
 *
 * Aturannya sama dengan yang sebelumnya tertanam di `CurriculumTable`:
 *   - lingkupnya satu kurikulum + kelas + semester;
 *   - di dalamnya per mapel; tema diurutkan menurut `sort_order` terkecil
 *     barisnya (nomor tema = urutannya, mulai 1);
 *   - topik diurutkan menurut kemunculan pertamanya di dalam tema (mulai 1);
 *   - CP adalah baris topik yang `learning_outcomes`-nya TIDAK null, menurut
 *     urutan barisnya (mulai 1). Baris `learning_outcomes = null` hanya penanda
 *     keberadaan topik, bukan CP.
 *
 * Urutan antarbaris yang `sort_order`-nya sama dipastikan lewat `created_at`
 * lalu `id`, supaya nomornya tidak bergantung pada urutan acak database.
 */
export interface BarisKurikulum {
  id: string
  curriculum: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string | null
  learning_outcomes: string | null
  sort_order: number
  created_at?: string | null
  /** Nama mapel — tema dan topik bernomor di dalam mapelnya. */
  subjectName: string
}

export interface NomorKurikulum {
  tema: number
  topik: number
  /** Null untuk baris penanda topik (bukan CP). */
  cp: number | null
}

export function nomorKurikulum(baris: BarisKurikulum[]): Map<string, NomorKurikulum> {
  const hasil = new Map<string, NomorKurikulum>()
  const urut = [...baris].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.created_at ?? '').localeCompare(b.created_at ?? '') ||
      a.id.localeCompare(b.id),
  )

  // lingkup -> mapel -> tema -> baris (sudah berurutan)
  const lingkup = new Map<string, Map<string, Map<string, BarisKurikulum[]>>>()
  const urutanTema = new Map<string, number>() // `${lingkup}__${mapel}__${tema}` -> sort_order terkecil
  for (const b of urut) {
    const kl = `${b.curriculum}|${b.grade_level}|${b.semester}`
    const tema = b.theme ?? 'Lainnya'
    const perMapel = lingkup.get(kl) ?? new Map<string, Map<string, BarisKurikulum[]>>()
    lingkup.set(kl, perMapel)
    const perTema = perMapel.get(b.subjectName) ?? new Map<string, BarisKurikulum[]>()
    perMapel.set(b.subjectName, perTema)
    const isi = perTema.get(tema) ?? []
    isi.push(b)
    perTema.set(tema, isi)
    const kunci = `${kl}__${b.subjectName}__${tema}`
    if (!urutanTema.has(kunci) || b.sort_order < urutanTema.get(kunci)!) urutanTema.set(kunci, b.sort_order)
  }

  for (const [kl, perMapel] of lingkup) {
    for (const [mapel, perTema] of perMapel) {
      const tema = [...perTema.entries()].sort(
        (a, b) => (urutanTema.get(`${kl}__${mapel}__${a[0]}`) ?? 0) - (urutanTema.get(`${kl}__${mapel}__${b[0]}`) ?? 0),
      )
      tema.forEach(([, isi], temaIdx) => {
        const topik = new Map<string, BarisKurikulum[]>()
        for (const b of isi) {
          if (!b.topic) continue
          topik.set(b.topic, [...(topik.get(b.topic) ?? []), b])
        }
        let topikIdx = 0
        for (const rows of topik.values()) {
          topikIdx++
          let cp = 0
          for (const b of rows) {
            hasil.set(b.id, { tema: temaIdx + 1, topik: topikIdx, cp: b.learning_outcomes !== null ? ++cp : null })
          }
        }
      })
    }
  }
  return hasil
}

/** "1.1.8" — atau "1.1" untuk baris penanda topik. */
export function formatNomor(n: NomorKurikulum): string {
  return n.cp === null ? `${n.tema}.${n.topik}` : `${n.tema}.${n.topik}.${n.cp}`
}
