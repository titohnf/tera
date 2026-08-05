/**
 * The curriculum axes, in one place. These lists used to be copy-pasted as
 * local `CURRICULA` / `GRADES` / `SEMESTERS` constants in four components,
 * which is how TKA ended up in the database but invisible in the UI.
 */

export const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Cambridge', 'TKA'] as const
export type Curriculum = typeof CURRICULA[number]

export const TKA: Curriculum = 'TKA'

export const ALL_GRADES = Array.from({ length: 12 }, (_, i) => `Kelas ${i + 1}`)
export const SEMESTERS = [1, 2]

/**
 * TKA (Tes Kemampuan Akademik) is sat at the end of each jenjang, so a TKA
 * topic is filed under the grade that takes the test — not the grade whose
 * material it covers, which is the whole jenjang.
 */
export const TKA_GRADES = ['Kelas 6', 'Kelas 9', 'Kelas 12']

/**
 * TKA has no semesters, but `curriculum_topics.semester` is `not null check
 * (semester in (1, 2))` and part of the topic group's unique key, so every TKA
 * row carries this filler. The number is meaningless — the UI hides the
 * semester control whenever `hasSemester()` is false so it never shows.
 */
export const TKA_SEMESTER = 1

export function gradesFor(curriculum: string): string[] {
  return curriculum === TKA ? TKA_GRADES : ALL_GRADES
}

export function hasSemester(curriculum: string): boolean {
  return curriculum !== TKA
}

/** The semester to file a row under: the chosen one, or TKA's filler. */
export function semesterFor(curriculum: string, chosen: number): number {
  return hasSemester(curriculum) ? chosen : TKA_SEMESTER
}
