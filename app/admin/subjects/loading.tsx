export default function SubjectsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-6" />
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 mb-6">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        <div className="divide-y">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white" />)}
        </div>
      </div>
    </div>
  )
}
