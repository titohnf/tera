export function splitClassName(name: string): { semesterLabel: string | null; title: string } {
  const match = name.match(/SM\s+\d+\s+\d{4}\/\d{4}/)
  if (!match) return { semesterLabel: null, title: name }
  const title = name.replace(match[0], '').replace(/\s+/g, ' ').trim()
  return { semesterLabel: match[0], title }
}

const CLASS_PREFIX_RE = /^(Grup|Privat)\s+(\d+\s+)?(Calistung|SD|SMP|SMA|Umum)\b/

// Splits off the "Grup 7 SMP" / "Privat 8 SMP" lead-in from the rest of a class name.
export function splitClassPrefix(name: string): { prefix: string; rest: string } {
  const match = name.match(CLASS_PREFIX_RE)
  if (!match) return { prefix: '', rest: name }
  return { prefix: match[0], rest: name.slice(match[0].length).trim() }
}
