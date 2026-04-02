/**
 * Dashboard Skeleton Component
 *
 * Loading state for the Dashboard page.
 * Mirrors the layout of Dashboard.tsx with skeleton placeholders.
 */

import {
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  SkeletonStatCard,
  SkeletonCard,
  SkeletonProgress,
  SkeletonList,
  SkeletonAvatar
} from './SkeletonPrimitives'

export default function DashboardSkeleton() {
  return (
    <div className="flex-grow overflow-y-auto" role="status" aria-label="Loading dashboard">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome CTA Skeleton */}
        <div className="relative overflow-hidden bg-surface-container-highest rounded-[2.5rem] border border-outline-variant/20 p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4 w-full">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-10 w-3/4" />
              <SkeletonText lines={2} className="w-full" />
              <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
            {/* Stats Grid */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent History Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <SkeletonCircle className="w-5 h-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>

            {/* Analysis List */}
            <SkeletonList count={3} />
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-8">
            {/* Profile Card */}
            <SkeletonCard className="p-8 relative overflow-hidden">
              <div className="text-center">
                <SkeletonAvatar className="w-20 h-20 mx-auto mb-4 rounded-[2rem]" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto mb-6" />
                <SkeletonProgress className="mb-8" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            </SkeletonCard>

            {/* Top Gaps Widget */}
            <SkeletonCard className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <SkeletonCircle className="w-5 h-5" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SkeletonCircle className="w-2 h-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </SkeletonCard>

            {/* Resume Vault */}
            <SkeletonCard className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <SkeletonCircle className="w-5 h-5" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/10 flex items-center gap-4">
                <SkeletonCircle className="w-10 h-10 rounded-xl" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-24" />
                </div>
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard content...Please wait.</span>
    </div>
  )
}
