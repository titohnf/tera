const AVATAR_COLOR_PALETTE = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
]

/** Deterministic solid background color for a fallback (no-photo) avatar, so each person gets a stable but distinct color. */
export function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_COLOR_PALETTE[Math.abs(hash) % AVATAR_COLOR_PALETTE.length]
}
