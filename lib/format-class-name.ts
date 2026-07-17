export function splitClassName(name: string): { semesterLabel: string | null; title: string } {
  const match = name.match(/SM\s+\d+\s+\d{4}\/\d{4}/)
  if (!match) return { semesterLabel: null, title: name }
  const title = name.replace(match[0], '').replace(/\s+/g, ' ').trim()
  return { semesterLabel: match[0], title }
}
