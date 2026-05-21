export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-5" />
      <div className="h-6 w-28 bg-gray-200 rounded mb-6" />
      <div className="space-y-3">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4 space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-100 rounded-lg mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
