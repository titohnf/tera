'use client'

import ExportCsvButton from '@/components/admin/ExportCsvButton'

type Row = Record<string, string | number | null>

export default function ReportsExport({ rows, filename }: { rows: Row[]; filename: string }) {
  return <ExportCsvButton rows={rows} filename={filename} label="Export CSV" />
}
