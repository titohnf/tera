'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Cetak
    </button>
  )
}
