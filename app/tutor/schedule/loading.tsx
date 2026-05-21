export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
      <div className="flex gap-2 mb-6">
        {[0, 1, 2].map(i => <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />)}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
