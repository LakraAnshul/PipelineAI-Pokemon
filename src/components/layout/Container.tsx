import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** The one place the page's horizontal rhythm is decided. */
export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}
