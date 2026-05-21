export default function PricingLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded mb-6" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
