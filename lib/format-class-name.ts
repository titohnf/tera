export function splitClassName(name: string): { semesterLabel: string | null; title: string } {
  const match = name.match(/SM\s+\d+\s+\d{4}\/\d{4}/)
  if (!match) return { semesterLabel: null, title: name }
  const title = name.replace(match[0], '').replace(/\s+/g, ' ').trim()
  return { semesterLabel: match[0], title }
}

// Class names carry a trailing internal-only tag after "SM <semester>
// <year>/<year+1>" (e.g. a student's name or several combined, like
// "HafidzAnka") used to keep otherwise-identical class names unique. Strip
// it for parent-facing text (WhatsApp messages, etc.) — this doesn't try to
// match a specific student's name, since group classes combine multiple.
export function stripClassUniqueTag(name: string): string {
  const match = name.match(/SM\s+\d+\s+\d{4}\/\d{4}/)
  if (!match || match.index == null) return name
  return name.slice(0, match.index + match[0].length).trim()
}

const CLASS_PREFIX_RE = /^(Grup|Privat)\s+(\d+\s+)?(Calistung|SD|SMP|SMA|Umum)\b/

// Splits off the "Grup 7 SMP" / "Privat 8 SMP" lead-in from the rest of a class name.
export function splitClassPrefix(name: string): { prefix: string; rest: string } {
  const match = name.match(CLASS_PREFIX_RE)
  if (!match) return { prefix: '', rest: name }
  return { prefix: match[0], rest: name.slice(match[0].length).trim() }
}
