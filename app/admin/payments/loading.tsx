export default function PaymentsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="flex gap-2 mb-5">
        {[...Array(3)].map((_, i) => <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />)}
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
