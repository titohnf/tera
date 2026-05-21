export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-5" />
      <div className="h-6 w-28 bg-gray-200 rounded mb-6" />
      <div className="h-32 bg-gray-100 border-2 border-dashed border-gray-200 rounded-xl mb-6" />
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
