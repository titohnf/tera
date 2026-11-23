/**
 * Rangka pemuatan generik untuk halaman portal (Misi, Materi, Try Out, Profil):
 * pita judul lalu beberapa kartu. Bentuknya sengaja netral — tujuannya memberi
 * tanda bahwa ketukan tadi masuk, bukan meniru isi tiap halaman.
 */
export default function RangkaMemuat() {
  return (
    <div className="space-y-3" aria-busy>
      <span className="sr-only">Memuat…</span>
      <div className="h-4 w-48 shimmer rounded" />
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
          <div className="h-10 w-10 shrink-0 shimmer rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 shimmer rounded" />
            <div className="h-3 w-48 max-w-full shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
