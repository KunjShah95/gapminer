import {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonList,
  SkeletonChart,
  SkeletonTable,
} from "./SkeletonPrimitives";

export function AnalysisResultsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard><Skeleton className="h-24 w-full" /></SkeletonCard>
        <SkeletonCard><Skeleton className="h-24 w-full" /></SkeletonCard>
        <SkeletonCard><Skeleton className="h-24 w-full" /></SkeletonCard>
      </div>
      <SkeletonChart />
      <SkeletonTable rows={4} />
    </div>
  );
}

export function RoadmapSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-72" />
      <SkeletonCard>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      <SkeletonCard>
        <SkeletonText lines={4} />
      </SkeletonCard>
    </div>
  );
}

export function JobTrackerSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-56" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonList count={5} />
    </div>
  );
}

export function MarketDemandSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i}><Skeleton className="h-20 w-full" /></SkeletonCard>
        ))}
      </div>
      <SkeletonChart />
    </div>
  );
}

export function SkillProgressSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i}><Skeleton className="h-32 w-full" /></SkeletonCard>
        ))}
      </div>
    </div>
  );
}
