export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-28 bg-gray-200 rounded mb-4" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-8 w-28 bg-gray-200 rounded-full" />)}
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  )
}
