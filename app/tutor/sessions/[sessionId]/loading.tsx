export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-5" />
      <div className="bg-gray-200 rounded-xl h-40 mb-6" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
