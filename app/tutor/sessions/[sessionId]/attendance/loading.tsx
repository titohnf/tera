export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-5" />
      <div className="h-6 w-28 bg-gray-200 rounded mb-6" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded-lg mt-6" />
    </div>
  )
}
