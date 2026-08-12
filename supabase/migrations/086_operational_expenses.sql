-- ============================================================
-- `operational_expenses` — biaya jalan bimbel di luar gaji tutor
--
-- Sampai sekarang satu-satunya pengeluaran yang tercatat di Tera adalah slip
-- gaji tutor. Akibatnya "Pemasukan − Pengeluaran" di dashboard bukan laba:
-- sewa tempat, listrik, internet, ATK, dan iklan tidak pernah ikut dihitung,
-- jadi angkanya selalu terlihat lebih untung daripada kenyataannya.
--
-- Satu baris = satu pengeluaran yang benar-benar terjadi pada `incurred_on`.
-- Biaya rutin seperti sewa bulanan tidak disimpan sebagai aturan berulang tapi
-- dicatat ulang tiap bulan (halaman Laba Rugi menyediakan tombol "salin dari
-- bulan lalu"). Aturan berulang menuntut jawaban untuk pertanyaan yang tidak
-- punya jawaban tunggal — sewa yang naik di tengah tahun, listrik yang beda
-- tiap bulan, iklan yang berhenti — dan tetap saja perlu dikoreksi manual.
--
-- Kategorinya dikunci lewat check constraint, bukan tabel referensi tersendiri:
-- daftarnya pendek, jarang berubah, dan dipakai untuk mengelompokkan angka di
-- laporan. Kalau nanti perlu kategori baru, tambah nilainya di constraint ini
-- dan di EXPENSE_CATEGORIES pada lib/finance/laba-rugi.ts — keduanya harus
-- sama, dan constraint-lah yang menjaga typo tidak diam-diam jadi kategori
-- baru yang hanya muncul sebagai satu baris sendirian di laporan.
-- ============================================================

create table if not exists operational_expenses (
  id uuid primary key default uuid_generate_v4(),
  incurred_on date not null,
  category text not null check (category in (
    'sewa',        -- sewa tempat / ruang kelas
    'utilitas',    -- listrik, air, kebersihan
    'internet',    -- internet, pulsa, langganan aplikasi
    'gaji_staf',   -- honor admin & staf non-tutor
    'atk',         -- alat tulis, cetak modul, fotokopi
    'marketing',   -- iklan, brosur, promosi
    'peralatan',   -- pembelian & perbaikan alat
    'transport',   -- transportasi operasional
    'konsumsi',    -- konsumsi kegiatan
    'pajak',       -- pajak & retribusi
    'lainnya'
  )),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column operational_expenses.incurred_on is
  'Tanggal uang keluar. Laporan laba rugi mengelompokkan biaya berdasarkan kolom ini.';
comment on column operational_expenses.description is
  'Keterangan singkat yang muncul di laporan, misal "Sewa ruko Juli 2026".';

-- Laporan selalu mengambil satu bulan sekaligus dan mengurutkan dari yang
-- terbaru, jadi indeksnya menurut tanggal.
create index if not exists operational_expenses_incurred_on_idx
  on operational_expenses (incurred_on desc);

create trigger set_operational_expenses_updated_at before update on operational_expenses
  for each row execute function set_updated_at();

-- Angka biaya operasional adalah isi dompet pemilik bimbel: tutor dan keluarga
-- tidak boleh melihatnya sama sekali, tidak seperti payslips yang tutor boleh
-- baca miliknya sendiri. Jadi cuma admin, baca maupun tulis.
alter table operational_expenses enable row level security;

create policy "Admin full access on operational_expenses"
  on operational_expenses for all
  using (is_admin())
  with check (is_admin());
