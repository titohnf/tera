'use client'

import ExportCsvButton from '@/components/admin/ExportCsvButton'

type Row = {
  tanggal: string
  topik: string
  hadir: number
  terlambat: number
  absen: number
  izin: number
  rate: string
}

export default function AttendanceExport({ rows, filename }: { rows: Row[]; filename: string }) {
  return <ExportCsvButton rows={rows} filename={filename} label="Export CSV" />
}
