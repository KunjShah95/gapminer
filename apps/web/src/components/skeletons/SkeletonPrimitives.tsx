/**
 * Generic Skeleton Components
 *
 * Base primitives for building loading skeletons throughout the app.
 * Uses Tailwind's animate-pulse with the app's design system.
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton element with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-container-high rounded-lg',
        className
      )}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton circle - for avatars, icons, score circles
 */
export function SkeletonCircle({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
    />
  )
}

/**
 * Skeleton text - for headings, paragraphs, labels
 */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 w-full', className)}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton card - for content cards
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'glass bg-surface-container-high rounded-[2rem] border border-outline-variant/10 p-6',
        className
      )}
    >
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  )
}

/**
 * Skeleton list - for lists of items
 */
export function SkeletonList({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 glass bg-surface-container-high rounded-[1.5rem] border border-outline-variant/10"
        >
          <SkeletonCircle className="w-12 h-12" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton stat card - for dashboard stats
 */
export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'glass bg-surface-container p-4 rounded-3xl border border-outline-variant/10 text-center w-32',
        className
      )}
    >
      <SkeletonCircle className="w-5 h-5 mx-auto mb-2" />
      <Skeleton className="h-6 w-12 mx-auto mb-1" />
      <Skeleton className="h-2 w-16 mx-auto" />
    </div>
  )
}

/**
 * Skeleton chart - for chart containers
 */
export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-6">
        <SkeletonCircle className="w-4 h-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-2xl" />
    </div>
  )
}

/**
 * Skeleton table - for table data
 */
export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-outline-variant/10">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton timeline - for roadmap milestones
 */
export function SkeletonTimeline({ count = 4, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-6">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <SkeletonCircle className="w-12 h-12" />
            {i < count - 1 && (
              <Skeleton className="w-px flex-grow my-2" />
            )}
          </div>
          {/* Content */}
          <div className="flex-grow pb-12">
            <div className="glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-2 flex-grow">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <SkeletonCircle className="w-10 h-10" />
              </div>
              <SkeletonText lines={2} className="w-full mb-6" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-xl" />
                <Skeleton className="h-6 w-14 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton input - for form inputs
 */
export function SkeletonInput({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn('h-12 w-full rounded-2xl', className)}
    />
  )
}

/**
 * Skeleton button - for action buttons
 */
export function SkeletonButton({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn('h-12 w-32 rounded-2xl', className)}
    />
  )
}

/**
 * Skeleton avatar - for user avatars
 */
export function SkeletonAvatar({ className }: SkeletonProps) {
  return (
    <SkeletonCircle
      className={cn('w-20 h-20', className)}
    />
  )
}

/**
 * Skeleton progress bar - for progress indicators
 */
export function SkeletonProgress({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}
