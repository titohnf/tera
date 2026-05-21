export default function AttendanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-52 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
