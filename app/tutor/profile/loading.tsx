export default function ProfileLoading() {
  return (
    <div className="animate-pulse max-w-xl">
      <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 mb-6 space-y-3">
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 space-y-3">
        <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-28 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}
