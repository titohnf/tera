export default function AnnouncementsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
