export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
