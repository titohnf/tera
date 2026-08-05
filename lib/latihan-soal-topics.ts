// Latihan soal disimpan per TOPIK, bukan per CP (migrasi 080): satu topik
// biasanya punya beberapa capaian pembelajaran, tapi latihan soalnya satu.
//
// Ada di lib, bukan di salah satu komponen, karena pengelompokannya dipakai
// dua tempat yang menulis ke kolom yang sama — `LatihanSoalTab` (tab sesi tutor
// dan admin) dan `AdminSessionTabs` (panel admin). Dua salinan logika kunci
// penyimpanan sudah pernah menyimpang di sini; sekali menyimpang, satu panel
// menulis kunci yang tidak terbaca panel lainnya.

export interface LatihanSoalCpRow {
  id: string
  group_id: string | null
  learning_outcomes: string | null
  theme: string | null
  topic: string
}

/** Satu kartu latihan soal. `key` adalah yang jadi kunci di `sessions.cp_urls`. */
export interface LatihanSoalTopic {
  key: string
  heading: string
  outcomes: string[]
}

/** Kunci untuk CP bebas milik kelas privat — semuanya satu topik di sesi itu. */
export const CUSTOM_TOPIC_KEY = 'custom'

export function groupCpsByTopic(cps: LatihanSoalCpRow[]): LatihanSoalTopic[] {
  const byKey = new Map<string, LatihanSoalTopic>()
  for (const cp of cps) {
    // CP yang barisnya belum punya group_id (data lama sebelum backfill
    // migrasi 060) tetap dapat kartunya sendiri, dikunci id CP-nya — lebih
    // baik daripada semuanya tumpah ke satu kartu tanpa nama.
    const key = cp.group_id ?? cp.id
    const entry = byKey.get(key)
    if (entry) {
      if (cp.learning_outcomes) entry.outcomes.push(cp.learning_outcomes)
    } else {
      byKey.set(key, {
        key,
        heading: [cp.theme, cp.topic].filter(Boolean).join(' — '),
        outcomes: cp.learning_outcomes ? [cp.learning_outcomes] : [],
      })
    }
  }
  return [...byKey.values()]
}
