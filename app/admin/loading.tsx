export default function AdminDashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
