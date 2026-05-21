'use client'

export default function ExportCsvButton({ rows, filename, label = 'Export CSV' }: {
  rows: Record<string, string | number | null>[]
  filename: string
  label?: string
}) {
  function handleExport() {
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const lines = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] ?? ''
          const str = String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        }).join(',')
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="pl-3 pr-9 py-2 border rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </button>
  )
}
