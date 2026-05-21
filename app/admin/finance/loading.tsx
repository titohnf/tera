export default function FinanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-6" />
      <div className="h-9 w-40 bg-gray-200 rounded-lg mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-24 bg-gray-200 rounded-xl ${i === 2 ? 'col-span-2' : ''}`} />
        ))}
      </div>
      <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        <div className="divide-y">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white" />)}
        </div>
      </div>
    </div>
  )
}
