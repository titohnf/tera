export default function AnnouncementsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-6" />
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 mb-6 space-y-3">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-20 bg-gray-100 rounded-lg" />
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        <div className="divide-y">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white" />)}
        </div>
      </div>
    </div>
  )
}
