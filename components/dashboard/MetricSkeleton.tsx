export function MetricCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="h-2.5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-5 bg-gray-200 rounded w-2/5 mb-2" />
      <div className="h-2 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: count }, (_, i) => <MetricCardSkeleton key={i} />)}
    </div>
  )
}
