export default function ClassesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-gray-200 rounded" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
