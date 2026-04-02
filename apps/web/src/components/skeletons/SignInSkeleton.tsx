import { Skeleton, SkeletonCircle, SkeletonText } from './SkeletonPrimitives'

export function SignInSkeleton() {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-8 relative overflow-hidden hero-mesh">
      {/* Background Blurs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      {/* Navigation placeholder */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <SkeletonCircle className="w-10 h-10 rounded-2xl" />
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="w-full max-w-md">
        <div className="glass bg-surface-container-high p-8 lg:p-12 rounded-[2.5rem] border border-outline-variant/20 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-10 flex flex-col items-center">
            <Skeleton className="h-8 w-48 mb-3" />
            <SkeletonText lines={2} className="w-64 max-w-full" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-outline-variant/10"></div>
            </div>
            <span className="relative px-4 text-xs font-bold uppercase tracking-widest text-outline bg-surface-container-high text-transparent select-none inline-block">
              <Skeleton className="h-4 w-16" />
            </span>
          </div>

          {/* Auth Form */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 ml-1 mb-2" />
              <Skeleton className="h-[52px] w-full rounded-2xl" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1 mb-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-[52px] w-full rounded-2xl" />
            </div>

            <Skeleton className="h-14 w-full rounded-2xl mt-8" />
          </div>

          {/* Toggle */}
          <div className="mt-10 flex justify-center">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Security / Terms */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-2 w-48" />
        </div>
      </div>
    </div>
  )
}
