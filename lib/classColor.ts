const CLASS_COLOR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

// Deterministic per classId so a class keeps the same color across renders/pages.
export function classColorClass(classId: string): string {
  let hash = 0
  for (let i = 0; i < classId.length; i++) hash = (hash * 31 + classId.charCodeAt(i)) | 0
  return CLASS_COLOR_PALETTE[Math.abs(hash) % CLASS_COLOR_PALETTE.length]
}
