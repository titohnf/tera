export default function SessionsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-44 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-5">
        {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />)}
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
