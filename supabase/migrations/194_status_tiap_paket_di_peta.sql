-- ============================================================
-- Status tiap paket, untuk kartu Misi
--
-- Kartu topik di peta selama ini cuma bisa mengabarkan SATU paket: yang
-- berikutnya. Anak yang membuka Misi melihat "Kerjakan C3" dan tidak punya cara
-- mengetahui bahwa C1 dan C2 sudah lolos, bahwa C4–C6 ada sebagai pengayaan,
-- atau bahwa ujiannya masih menunggu — kecuali dengan membuka halaman topik
-- satu per satu. Padahal justru deretan itulah yang menjawab "aku sudah sampai
-- mana", pertanyaan yang dibawa hampir setiap anak yang membuka layar ini.
--
-- KENAPA FUNGSI BARU, bukan memakai `topik_paket_state` yang sudah ada:
-- yang itu menerima SATU topik dan menghitung per BUTIR — benar, sebagian,
-- salah, belum, skor, maks. Ia memang dipakai halaman topik, yang menggambar
-- rincian satu topik. Memanggilnya sembilan belas kali untuk menggambar peta
-- berarti sembilan belas agregasi per-butir demi tujuh keping berwarna per
-- kartu.
--
-- Yang di sini mengembalikan SELURUH topik aktif sekali jalan, dan cuma yang
-- dibutuhkan sebuah keping: lolos atau belum, terkunci atau tidak, wajib atau
-- pengayaan, pernah disentuh atau belum. Ongkosnya sebanding dengan
-- `topik_langkah_berikutnya` — sama-sama satu `skor_paket_topik` per paket
-- latihan — dan bentuknya sengaja dibuat sedatar mungkin supaya layar tidak
-- perlu menghitung apa pun lagi.
--
-- ATURAN "LOLOS" DISALIN DARI 192, sama persis dengan yang dipakai memilih
-- langkah (193) dan menentukan ketuntasan: nilai AKHIR, dan seluruh butirnya
-- terjawab. Kalau keping C3 di kartu berwarna hijau sementara tombol di
-- bawahnya berkata "Kerjakan C3", yang rusak bukan tampilan melainkan
-- kepercayaan anak pada seluruh layar.
--
-- UJIAN IKUT PULANG sebagai keping terakhir. `lolos` untuknya berarti sudah
-- pernah dikerjakan — bukan nilainya di atas ambang. Ujian tidak punya putaran
-- kedua (189), jadi "sudah" dan "lolos" adalah keadaan yang sama, dan
-- membedakannya di layar anak cuma akan mengabarkan kegagalan yang tidak bisa
-- ia perbaiki hari itu.
-- ============================================================

create or replace function topik_paket_ringkas(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  topik_id text,
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  -- Paket latihan di luar cakupan Bloom topiknya (182): boleh dikerjakan, tidak
  -- menentukan ketuntasan, tidak menahan ujian.
  pengayaan boolean,
  -- Latihan: nilai akhirnya sudah di atas ambang dan seluruh butirnya terjawab
  -- (aturan 192). Ujian: sudah pernah dikerjakan.
  lolos boolean,
  terkunci boolean,
  -- Kapan yang terkunci terbuka lagi, atau null.
  --
  -- Ikut pulang karena sejak 193 paket yang DITAWARKAN bisa berbeda dari paket
  -- yang terkunci: alurnya jatuh ke pengayaan selama wajibnya tertutup. Tanpa
  -- kolom ini kartu kehilangan satu-satunya kabar yang menjelaskan kenapa
  -- tombolnya tiba-tiba menyebut C4 — dan anak yang tidak diberi tahu bahwa C3
  -- kembali besok akan mengira ia sudah melewatinya.
  buka_pada timestamptz,
  -- Pernah dikerjakan sampai ada putaran yang selesai. Membedakan "belum
  -- disentuh" dari "sudah dicoba, belum lolos" — dua keadaan yang tidak boleh
  -- digambar dengan keping yang sama.
  pernah_dikerjakan boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  ambang as (
    select coalesce(
      (select (nilai #>> '{}')::numeric from pengaturan where kunci = 'ambang_mastery'),
      0.75
    ) as nilai
  ),
  dasar as (
    select p.topik_id,
           p.id as paket_id,
           p.jenis,
           p.level_bloom,
           p.nomor,
           (
             p.jenis = 'latihan'
             and t.bloom_min is not null
             and p.level_bloom is not null
             and p.level_bloom not between t.bloom_min and t.bloom_maks
           ) as pengayaan,
           case
             when p.jenis = 'ujian' then exists (
               select 1 from practice_sessions ps
               where ps.learner_id = (select learner from me)
                 and ps.paket_topik_id = p.id
             )
             else coalesce(s.butir_paket, 0) > 0
                  and coalesce(s.butir_terjawab, 0) >= s.butir_paket
                  and coalesce(s.skor_akhir, 0) >= (select nilai from ambang)
           end as lolos,
           coalesce(paket_terkunci((select learner from me), p.id), false) as terkunci,
           paket_buka_pada((select learner from me), p.id) as buka_pada,
           coalesce(s.putaran, 0) > 0 as pernah_dikerjakan
    from paket_topik p
    join topik t on t.id = p.topik_id
    left join lateral skor_paket_topik((select learner from me), p.id) s on true
    where t.aktif
      and (select learner from me) is not null
  )
  -- Urutan barisnya SUDAH urutan gambarnya: wajib menaik, lalu pengayaan
  -- menaik, lalu ujian di ujung. Layar tinggal menggambar apa adanya — begitu
  -- pengurutan pindah ke browser, dua permukaan yang memakai fungsi ini bisa
  -- menyusunnya berbeda tanpa ada yang menyadarinya.
  select topik_id, paket_id, jenis, level_bloom, nomor,
         pengayaan, lolos, terkunci, buka_pada, pernah_dikerjakan
  from dasar
  order by topik_id, (jenis = 'ujian'), pengayaan, level_bloom nulls last, nomor;
$$;

comment on function topik_paket_ringkas(text, uuid) is
  'Keadaan tiap paket seluruh topik aktif untuk satu murid, sekali jalan — bahan deretan keping di kartu Misi. Lolos memakai aturan 192 (nilai akhir, seluruh butir terjawab); untuk ujian berarti sudah pernah dikerjakan.';

grant execute on function topik_paket_ringkas(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
