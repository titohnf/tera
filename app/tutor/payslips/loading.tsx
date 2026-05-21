export default function TutorPayslipsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}
