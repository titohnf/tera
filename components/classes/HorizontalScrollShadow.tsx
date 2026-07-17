'use client'

import { useRef, useState, type ReactNode } from 'react'

export default function HorizontalScrollShadow({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className={className}
      onScroll={() => setScrolled((ref.current?.scrollLeft ?? 0) > 0)}
      data-scrolled={scrolled || undefined}
    >
      {children}
    </div>
  )
}
