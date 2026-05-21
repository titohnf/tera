export default function PayslipsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-9 w-64 bg-gray-200 rounded-lg mb-5" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
