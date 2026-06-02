interface Props {
  lastUpdatedAt: string
}

export default function StatusSummary({ lastUpdatedAt }: Props) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard Admin</h1>
      <p className="text-xs text-gray-400 mt-0.5">Diperbarui {lastUpdatedAt}</p>
    </div>
  )
}
