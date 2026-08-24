-- ============================================================
-- Langganan: hak pakai SORA dan GAMA untuk akun `mandiri`
--
-- Dua hal sengaja dipisahkan di sini, dan pemisahan itu adalah seluruh isi
-- rancangannya:
--
--   * ROLE menjawab "siapa kamu" — `parent` keluarga bimbel, `mandiri` orang
--     luar, `admin`/`tutor` staf.
--   * LANGGANAN menjawab "apa yang boleh kamu pakai".
--
-- TERA tidak pernah jadi sesuatu yang bisa dilangganani. Hak atas TERA turun
-- dari `family_students` (migrasi 076), dan setiap policy-nya berbentuk
-- `is_family() and family_covers_student(...)`. Akun `mandiri` tidak punya
-- baris di sana, jadi ia buta terhadap tagihan, jadwal, dan laporan bukan
-- karena ada yang disembunyikan — melainkan karena tidak ada barisnya. Tabel
-- ini tidak boleh dipakai untuk memberi akses TERA kepada siapa pun.
--
-- Kenapa baris, bukan kolom di `profiles`:
--
--   * Perpanjangan perlu riwayat. Siapa mengaktifkan, kapan, dengan rujukan
--     transfer apa — semuanya pertanyaan yang muncul belakangan, dan kolom yang
--     ditimpa tidak bisa menjawabnya.
--   * Produknya lebih dari satu, dan seseorang boleh berlangganan salah satu
--     saja.
--   * Payment gateway nanti cukup menyisipkan baris dengan `method` berbeda,
--     dengan cara yang persis sama dengan aksi admin hari ini. Itulah alasan
--     `method`, `reference`, dan `amount` sudah ada sekarang meski pembayaran
--     masih manual: menambahkannya belakangan berarti membongkar, sedangkan
--     membiarkannya kosong tidak merugikan apa pun.
-- ============================================================

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  product text not null check (product in ('sora','gama')),
  status text not null default 'pending'
    check (status in ('pending','active','stopped','expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  -- 'transfer' hari ini; 'gateway' saat webhook pembayaran dipasang.
  method text not null default 'transfer',
  -- Nomor rujukan transfer, atau id transaksi dari gateway.
  reference text,
  amount numeric(12,2),
  note text,
  activated_by uuid references profiles(id),
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_profile_idx
  on subscriptions(profile_id, product);

-- Dua langganan aktif untuk produk yang sama pada orang yang sama harus
-- MUSTAHIL, bukan sekadar tidak disarankan: perpanjangan menyisipkan baris
-- baru, dan kalau yang lama lupa ditutup, "kapan langganannya habis" jadi
-- pertanyaan tanpa jawaban tunggal.
create unique index if not exists subscriptions_one_active
  on subscriptions(profile_id, product) where status = 'active';

alter table subscriptions enable row level security;

-- Admin mengelola; pemilik hanya membaca miliknya. Tidak ada jalur tulis dari
-- sisi pelanggan sama sekali — aktivasi selalu keputusan admin, dan nanti
-- keputusan gateway, keduanya lewat service role.
create policy "Admins manage subscriptions" on subscriptions
  for all using (is_admin());
create policy "Owners read own subscriptions" on subscriptions
  for select using (profile_id = auth.uid());

-- Penjaga hak pakai -----------------------------------------------------------
--
-- `security definer` + `set row_security = off` mengikuti pola get_my_role()
-- (migrasi 004) dan family_covers_student() (076): fungsi ini dipanggil DARI
-- DALAM fungsi lain yang menjaga tabel, jadi ia sendiri tidak boleh tunduk RLS.
--
-- YANG BERKUASA ADALAH JENDELA TANGGALNYA, bukan `status`. Repo ini tidak punya
-- penjadwal, dan menambahkan satu hanya untuk membalik status berarti menambah
-- satu sumber kegagalan diam: kalau ia berhenti jalan, langganan kedaluwarsa
-- tetap terbuka tanpa ada yang tahu. Dengan memeriksa tanggalnya, akses putus
-- pada detik yang tepat walau tidak ada satu pun proses yang berjalan.
-- `status = 'expired'` cuma kerapian untuk daftar admin.
--
-- `ends_at` null berarti tanpa batas — dipakai untuk pemberian manual yang
-- memang tidak ingin dibatasi, bukan sebagai bawaan.

create or replace function has_product(p_product text)
returns boolean
language sql
security definer
stable
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from subscriptions s
    where s.profile_id = auth.uid()
      and s.product = p_product
      and s.status = 'active'
      and coalesce(s.starts_at, now()) <= now()
      and (s.ends_at is null or s.ends_at > now())
  );
$$;

notify pgrst, 'reload schema';
