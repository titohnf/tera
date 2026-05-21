export default function ClassesLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2">
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
              <div className="h-8 w-12 bg-gray-100 rounded" />
            </div>
            <div className="h-10 bg-gray-100 rounded border-t pt-3 mt-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
