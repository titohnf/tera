export default function ReportsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg" />)}
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <div className="h-16 bg-gray-50 border-b border-gray-100" />
            <div className="divide-y">
              {[...Array(4)].map((_, j) => <div key={j} className="h-12 bg-white" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
