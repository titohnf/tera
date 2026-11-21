-- ============================================================
-- Catatan kejadian selama peserta mengerjakan try out
--
-- Try out daring tidak bisa mengunci perangkat peserta: halaman web tidak
-- dapat melarang pindah tab, minimize, atau tangkapan layar. Yang bisa
-- dilakukan adalah MENDETEKSI dan MENCATATNYA, supaya tutor yang menilai.
-- Tabel ini menampung catatan itu. Tampilan pengerjaan ala TKA di Sora
-- (paket dengan `cbt_mode`) menulis ke sini; halaman hasil di Sora membacanya.
--
-- Sengaja HANYA mencatat, tidak pernah mengubah nilai atau mengirim paksa:
-- di ponsel, notifikasi atau panggilan masuk terbaca sebagai "keluar halaman",
-- dan peserta yang jujur tidak boleh dihukum otomatis karenanya.
--
-- Aman dijalankan ulang. Kode Sora tetap berfungsi bila migrasi ini belum
-- dijalankan; yang hilang hanya pencatatannya.
-- ============================================================

create table if not exists attempt_events (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  -- Didenormalisasi supaya halaman hasil satu paket bisa membaca semua
  -- kejadiannya sekali jalan, tanpa menggabungkan ke tabel attempts.
  quiz_id uuid not null references quizzes(id) on delete cascade,
  kind text not null check (kind in (
    'hilang_fokus',        -- jendela kehilangan fokus atau tab tersembunyi
    'kembali',             -- peserta kembali; durasi_ms = lama ia pergi
    'layar_penuh_keluar',  -- keluar dari layar penuh
    'salin',               -- mencoba menyalin atau memotong teks soal
    'cetak',               -- mencoba mencetak
    'klik_kanan',          -- membuka menu klik kanan
    'tombol_terlarang',    -- pintasan simpan, lihat sumber, atau alat pengembang
    'screenshot_key'       -- tombol PrintScreen
  )),
  durasi_ms integer check (durasi_ms is null or durasi_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists attempt_events_attempt_idx on attempt_events(attempt_id, created_at);
create index if not exists attempt_events_quiz_idx on attempt_events(quiz_id);

alter table attempt_events enable row level security;

-- Peserta anonim menulis lewat kode bagikan, jadi yang diperiksa adalah
-- percobaannya: harus milik paket itu, belum dikirim, dan paketnya terbit.
-- Sesudah dikirim, tidak ada lagi yang bisa ditambahkan.
drop policy if exists "Peserta mencatat kejadian di percobaan yang berjalan" on attempt_events;
create policy "Peserta mencatat kejadian di percobaan yang berjalan" on attempt_events
  for insert with check (
    exists (
      select 1
      from attempts a
      join quizzes q on q.id = a.quiz_id
      where a.id = attempt_events.attempt_id
        and a.quiz_id = attempt_events.quiz_id
        and a.submitted_at is null
        and q.status = 'published'
    )
  );

-- Yang boleh MEMBACA: admin, pembuat paket, dan tutor kelas paket itu.
-- Peserta tidak membaca catatan siapa pun.
drop policy if exists "Pengelola paket membaca kejadian" on attempt_events;
create policy "Pengelola paket membaca kejadian" on attempt_events
  for select using (
    is_admin()
    or exists (
      select 1
      from quizzes q
      where q.id = attempt_events.quiz_id
        and (
          q.created_by = auth.uid()
          or (q.class_id is not null and is_class_tutor(q.class_id))
        )
    )
  );

comment on table attempt_events is
  'Kejadian selama try out (keluar halaman, salin, cetak, dll). Hanya dicatat untuk dinilai tutor; tidak mengubah nilai.';
