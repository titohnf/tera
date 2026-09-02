-- ============================================================
-- Butir yang berakhir dengan menyerah, diturunkan bukan dicatat ulang
--
-- FR3 menuntut butir yang berakhir "menyerah, lihat kunci" tersimpan sebagai
-- `status_akhir_item` tersendiri dan DITAMPILKAN BERBEDA dari butir yang cuma
-- dijawab salah. Alasannya ada di dokumen fondasi Bagian 4.2: give-up rate
-- adalah metrik tersendiri, dan anak yang menyerah pada empat butir bukan anak
-- yang sama dengan anak yang salah pada empat butir lalu terus mencoba.
--
-- KENAPA TIDAK ADA KOLOM BARU. Di sini "menyerah" bukan tindakan per butir yang
-- perlu direkam; ia sudah terjadi dan tercatat, cuma pada tingkat yang berbeda.
-- Migrasi 145 membuat membuka kunci sebagai keputusan PER PAKET
-- (`paket_topik_kunci`, dengan `locked_at`), dan sesudahnya paket itu tidak
-- bisa dibuka lagi. Maka butir yang belum penuh nilainya saat kunci dibuka
-- adalah tepat butir yang diserahkan — tidak ada informasi yang hilang, dan
-- menambah kolom hanya akan membuat salinan kedua yang bisa berbeda dari
-- `paket_topik_kunci`.
--
-- YANG SENGAJA TIDAK DIUBAH: alurnya. PRD menulis "menyerah dan lihat kunci"
-- sebagai pilihan per soal, sedangkan di sini kunci dibuka sepaket. Mengubahnya
-- jadi per soal berarti menghidupkan lagi persis yang dihindari `PelariSesi`:
-- kunci yang lewat di layar sebelum putaran ulang membuat putaran ulang
-- kehilangan artinya. Perbedaan ini keputusan sadar, bukan kelalaian — dan yang
-- diminta FR3 dan FR8, yaitu bisa membedakan menyerah dari salah biasa,
-- terpenuhi tanpa perubahan itu.
-- ============================================================

-- 1. Status akhir tiap butir sebuah paket --------------------------------------

create or replace function status_butir_paket(
  p_learner_id uuid,
  p_paket_id uuid
)
returns table (
  question_bank_item_id uuid,
  ord integer,
  pernah_dijawab boolean,
  skor numeric,
  skor_maks numeric,
  status text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with terkunci as (
    select exists (
      select 1 from paket_topik_kunci l
      where l.learner_id = p_learner_id and l.paket_id = p_paket_id
    ) as ya
  ),
  -- Keadaan TERAKHIR tiap butir, lintas putaran — sama seperti skor akhir di
  -- 149. `distinct on` karena 114 menyisipkan jawaban tanpa kunci unik.
  jawaban as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where s.paket_topik_id = p_paket_id
      and a.learner_id = p_learner_id
    order by a.question_bank_item_id, a.answered_at desc
  )
  select i.question_bank_item_id,
         i.ord,
         j.question_bank_item_id is not null,
         j.score,
         j.max_score,
         case
           when j.score is not null
            and coalesce(j.max_score, 0) > 0
            and j.score >= j.max_score then 'tuntas'
           -- Butir yang belum pernah dijawab pun ikut terhitung menyerah kalau
           -- kuncinya sudah dibuka: paketnya tidak bisa dibuka lagi, jadi butir
           -- itu memang berakhir tanpa pernah dikerjakan sampai selesai.
           when (select ya from terkunci) then 'menyerah_lihat_kunci'
           else 'belum_tuntas'
         end
  from paket_topik_item i
  left join jawaban j on j.question_bank_item_id = i.question_bank_item_id
  where i.paket_id = p_paket_id
  order by i.ord;
$$;

comment on function status_butir_paket(uuid, uuid) is
  'Status akhir tiap butir sebuah paket untuk satu murid (PRD FR3): tuntas, menyerah_lihat_kunci, atau belum_tuntas. Diturunkan dari paket_topik_kunci, tidak disimpan. Tanpa gerbang — haknya dicabut dari publik.';

revoke all on function status_butir_paket(uuid, uuid) from public, anon, authenticated;

-- 2. Sampai ke rapor tutor -----------------------------------------------------
--
-- `tutor_pengukuran_paket` dibuat ulang untuk KETIGA kalinya (150, 152, dan di
-- sini), dan itu bukan kecerobohan yang berulang melainkan sifat Postgres:
-- menambah satu kolom keluaran mengubah tipe kembalian fungsi, dan tipe
-- kembalian tidak bisa diganti lewat `create or replace`. Yang bisa dilakukan
-- cuma memilih antara membuat ulang, atau membiarkan angkanya tinggal di fungsi
-- terpisah yang memaksa halaman memanggil satu kali per baris.
drop function if exists tutor_pengukuran_paket(uuid);

create or replace function tutor_pengukuran_paket(p_learner_id uuid)
returns table (
  topik_id text,
  topik_nama text,
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  putaran integer,
  putaran_1_selesai boolean,
  butir_paket integer,
  butir_terjawab_putaran_1 integer,
  skor_putaran_1 numeric,
  skor_akhir numeric,
  detik_per_butir numeric,
  butir_menyerah integer
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select t.id, t.nama, p.id, p.jenis, p.level_bloom, p.nomor,
         s.putaran, s.putaran_1_selesai, s.butir_paket,
         s.butir_terjawab_putaran_1, s.skor_putaran_1, s.skor_akhir,
         (
           select avg(
             greatest(
               extract(epoch from a.answered_at - a.waktu_mulai_item)
                 - coalesce(a.jeda_ms, 0) / 1000.0,
               0
             )
           )
           from practice_answers a
           join practice_sessions ps on ps.id = a.session_id
           where ps.paket_topik_id = p.id
             and a.learner_id = p_learner_id
             and a.waktu_mulai_item is not null
         ),
         (
           select count(*)::integer
           from status_butir_paket(p_learner_id, p.id) b
           where b.status = 'menyerah_lihat_kunci'
         )
  from paket_topik p
  join topik t on t.id = p.topik_id
  cross join lateral skor_paket_topik(p_learner_id, p.id) s
  where is_admin()
     or exists (
          select 1 from learners l
          where l.id = p_learner_id
            and l.tutor_penanggung_jawab_id = auth.uid()
        )
  order by t.urutan, p.jenis desc, p.nomor;
$$;

comment on function tutor_pengukuran_paket(uuid) is
  'Skor Putaran 1, skor akhir, waktu efektif per butir, dan banyaknya butir yang berakhir menyerah, tiap paket seorang murid (PRD FR3, FR6, FR8). Gerbang: admin atau tutor penanggung jawab.';

revoke all on function tutor_pengukuran_paket(uuid) from public, anon;
grant execute on function tutor_pengukuran_paket(uuid) to authenticated;

notify pgrst, 'reload schema';
