import Image from 'next/image'
import { getAvatarColor } from '@/lib/avatarColor'

export function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export default function Avatar({ name, avatarUrl, size = 40 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden ${avatarUrl ? '' : getAvatarColor(name ?? '?')}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name ?? ''} width={size} height={size} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-white">{getInitials(name)}</span>
      )}
    </div>
  )
}
