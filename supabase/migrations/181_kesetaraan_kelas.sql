-- ============================================================
-- "Kelas X, kemampuan setara kelas Y" — dihitung, dengan batas buktinya
--
-- Migrasi 180 memindahkan seluruh peta 67 topik berikut `kelas_kuasai`-nya.
-- Berkas ini yang memakainya, dan aturannya bukan aturan baru: Learning
-- Progression Bagian 1 sudah menuliskannya sendiri —
--
--   "Kalau siswa kelas 4 sudah menguasai SELURUH topik yang 'Kelas kuasai'-nya
--    = 7, klaim 'kemampuan setara kelas 7' punya dasar terukur — bukan klaim
--    marketing kosong."
--
-- SELURUH, bukan sebagian besar, dan KUMULATIF: setara kelas 7 menuntut setiap
-- topik yang mestinya dikuasai di kelas 7 ke bawah sudah tuntas. Satu lubang di
-- kelas 3 membatalkan klaim kelas 7 — dan memang harus begitu, karena lubang
-- itulah yang akan menahan anaknya nanti.
--
-- ------------------------------------------------------------
-- YANG MEMBUAT FUNGSI INI SULIT: DIAM YANG TERBACA SEBAGAI VONIS
--
-- Sebuah topik bisa tidak tuntas karena dua sebab yang berlawanan arah:
-- anaknya belum mampu, atau TIDAK ADA YANG PERNAH MENGUKURNYA. Hari ini sebab
-- kedua yang mendominasi — 48 dari 67 topik belum punya satu butir soal pun,
-- jadi seluruh topik kelas 1–6 mustahil tuntas oleh siapa pun.
--
-- Fungsi yang menjumlahkan begitu saja akan memulangkan "setara kelas 0" untuk
-- setiap anak di negeri ini, dan angka itu akan terbaca sebagai penilaian.
-- Maka fungsi ini memulangkan DUA angka, dan yang kedua yang menjaga yang
-- pertama jujur:
--
--   kelas_setara  — kelas tertinggi yang seluruh topiknya ke bawah sudah
--                   tuntas. NULL berarti klaim itu belum bisa dibuat.
--   batas_bukti   — kelas tertinggi yang seluruh topiknya ke bawah SUDAH BISA
--                   diukur hari ini, yaitu punya butir soal aktif. Ia langit-
--                   langit setiap klaim: `kelas_setara` tidak akan pernah
--                   melampauinya, dan kalau `batas_bukti` bernilai NULL maka
--                   tidak ada klaim apa pun yang boleh dibuat.
--
-- Dengan keadaan hari ini `batas_bukti` bernilai NULL untuk semua orang, karena
-- kelas 1 pun belum punya butir. Itu jawaban yang benar, dan jauh lebih berguna
-- daripada angka nol yang tampak seperti hasil pengukuran.
--
-- ------------------------------------------------------------
-- KENAPA `kelas_kuasai`, BUKAN `kelas_mulai`
--
-- Topik AC-13 membentang kelas 3–6. Memakai kelas mulai berarti menuntut anak
-- kelas 3 sudah menguasai apa yang memang baru matang di kelas 6 — klaim
-- ekuivalensi jadi terlalu galak dan tidak seorang pun akan lolos. `kelas_kuasai`
-- yang dipakai dokumen, dan itu pula yang dipakai di sini.
--
-- ------------------------------------------------------------
-- GERBANG. Ini pernyataan TENTANG seorang anak, dan yang boleh membacanya
-- keluarganya sendiri, tutor penanggung jawabnya, dan admin. Ia tidak memuat
-- Skor Putaran 1 dalam bentuk apa pun — hanya status topik, yang memang sudah
-- dilihat anaknya di peta — jadi larangan FR3 tidak dilanggar dengan
-- membukanya kepada keluarga.
--
-- Jalankan SESUDAH 180.
-- ============================================================

-- 1. Cakupan per kelas ---------------------------------------------------------
--
-- Satu baris per kelas 1–12: berapa topik yang mestinya dikuasai di kelas itu,
-- berapa yang sudah bisa diukur, berapa yang tuntas. Inilah yang membuat
-- angka tunggal di fungsi berikutnya bisa ditelusuri alih-alih dipercaya.
create or replace function cakupan_kelas(p_learner_id uuid)
returns table (
  kelas smallint,
  topik_total integer,
  topik_terukur integer,
  topik_tuntas integer
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with status as (
    select s.topik_id, s.status from status_topik_murid(p_learner_id) s
  ),
  -- Sebuah topik "bisa diukur" kalau ada paket latihannya yang memuat butir
  -- aktif. Bukan sekadar "topiknya ada": 48 topik yang dipindahkan 180 punya
  -- baris di `topik` dan nol butir, dan membiarkan keduanya terlihat sama
  -- adalah persis kekeliruan yang berkas ini dibangun untuk mencegah.
  butir as (
    select distinct p.topik_id
    from paket_topik p
    join paket_topik_item i on i.paket_id = p.id
    join question_bank_items b on b.id = i.question_bank_item_id
    where p.jenis = 'latihan' and b.status_verifikasi = 'aktif'
  )
  select k.kelas::smallint,
         count(t.id)::integer,
         count(*) filter (where b.topik_id is not null)::integer,
         count(*) filter (where s.status = 'tuntas')::integer
  from generate_series(1, 12) as k(kelas)
  left join topik t on t.kelas_kuasai = k.kelas
  left join butir b on b.topik_id = t.id
  left join status s on s.topik_id = t.id
  group by k.kelas
  order by k.kelas;
$$;

comment on function cakupan_kelas(uuid) is
  'Cakupan penguasaan seorang murid per kelas 1–12 menurut `topik.kelas_kuasai`: berapa topik seharusnya, berapa yang sudah bisa diukur, berapa yang tuntas.';

-- 2. Klaim ekuivalensinya ------------------------------------------------------
create or replace function kesetaraan_kelas(p_learner_id uuid)
returns table (
  kelas_terdaftar smallint,
  kelas_setara smallint,
  batas_bukti smallint,
  topik_tuntas integer,
  topik_terukur integer,
  topik_total integer
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with c as (select * from cakupan_kelas(p_learner_id))
  select
    -- Kelas terdaftar anak itu. NULL untuk murid tanpa profil — akun keluarga
    -- yang belum ditautkan. Yang NULL disebut NULL, tidak ditebak dari umur
    -- atau dari topik yang sedang ia kerjakan.
    (select p.grade::smallint
       from learners l join profiles p on p.id = l.profile_id
      where l.id = p_learner_id),

    -- Kelas tertinggi yang SELURUH topik sampai ke sana sudah tuntas. Ditulis
    -- sebagai "tidak ada kelas di bawahnya yang tertinggal", bukan sebagai
    -- penjumlahan — supaya sifat kumulatifnya menjadi bentuk kuerinya sendiri
    -- dan tidak bisa hilang saat seseorang menyuntingnya nanti.
    (select max(k.kelas)::smallint
       from c k
      where k.topik_total > 0
        and not exists (
          select 1 from c b
          where b.kelas <= k.kelas and b.topik_tuntas < b.topik_total
        )),

    -- Langit-langitnya: kelas tertinggi yang seluruh topiknya ke bawah sudah
    -- punya butir soal. Klaim tidak pernah boleh melampaui ini.
    (select max(k.kelas)::smallint
       from c k
      where k.topik_total > 0
        and not exists (
          select 1 from c b
          where b.kelas <= k.kelas and b.topik_terukur < b.topik_total
        )),

    (select sum(topik_tuntas)::integer from c),
    (select sum(topik_terukur)::integer from c),
    (select sum(topik_total)::integer from c);
$$;

comment on function kesetaraan_kelas(uuid) is
  'Klaim "kelas X, kemampuan setara kelas Y" (Learning Progression Bagian 1): seluruh topik dengan kelas_kuasai <= Y harus tuntas. `batas_bukti` adalah langit-langitnya — kelas tertinggi yang seluruh topiknya sudah punya butir soal. NULL berarti klaimnya belum bisa dibuat, bukan berarti anaknya tidak mampu.';

-- 3. Hak -----------------------------------------------------------------------
--
-- Keduanya `security definer` tanpa gerbang di dalam badannya, jadi haknya
-- dicabut dari publik dan permukaan bergerbang dibangun di atasnya.
revoke all on function cakupan_kelas(uuid) from public, anon, authenticated;
revoke all on function kesetaraan_kelas(uuid) from public, anon, authenticated;

create or replace function rapor_kesetaraan(p_learner_id uuid)
returns table (
  kelas_terdaftar smallint,
  kelas_setara smallint,
  batas_bukti smallint,
  topik_tuntas integer,
  topik_terukur integer,
  topik_total integer
)
language sql
stable
security definer
set search_path = public
as $$
  select k.* from kesetaraan_kelas(p_learner_id) k
  where is_admin()
     or exists (
          select 1 from learners l
          where l.id = p_learner_id and l.tutor_penanggung_jawab_id = auth.uid()
        )
     or exists (
          select 1 from learners l
          where l.id = p_learner_id and l.profile_id = auth.uid()
        )
     or exists (
          select 1 from learners l
          where l.id = p_learner_id
            and l.profile_id is not null
            and family_covers_student(l.profile_id)
        );
$$;

comment on function rapor_kesetaraan(uuid) is
  'Permukaan bergerbang untuk kesetaraan_kelas(): admin, tutor penanggung jawab, murid itu sendiri, atau keluarganya.';

grant execute on function rapor_kesetaraan(uuid) to authenticated;

notify pgrst, 'reload schema';
