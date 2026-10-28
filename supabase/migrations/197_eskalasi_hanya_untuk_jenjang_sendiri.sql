-- ============================================================
-- Eskalasi tutor tidak lahir dari topik di atas jenjang anak
--
-- Layar Misi menawarkan topik tanpa prasyarat kepada semua anak, termasuk
-- topik yang baru dipelajari di kelas di atas kelasnya. Anak kelas 2 yang
-- membuka D-19 (kelas 9) dan menyelesaikan dua paket latihan berturut-turut di
-- bawah ambang akan, menurut aturan 192, melahirkan baris `notifikasi_eskalasi`
-- — padahal ia tidak tersendat; ia mencoba sesuatu yang belum diajarkan.
--
-- YANG BERUBAH: `periksa_eskalasi_dua_paket()` kembali tanpa menulis apa pun
-- bila `topik.kelas_mulai` lebih besar dari `profiles.grade` anak itu.
--
-- YANG TIDAK BERUBAH: anak yang kelasnya kosong, topik yang kelas mulainya
-- kosong, dan seluruh aturan lain pada fungsinya. Berkas ini menyalin fungsi
-- dari 192 apa adanya, dengan satu syarat tambahan.
--
-- Hasil di atas jenjang tetap tersimpan dan tetap terbaca tutor lewat layar
-- pengukuran; yang dihentikan hanya pemanggilannya.
--
-- Jalankan SESUDAH 196.
-- ============================================================

create or replace function periksa_eskalasi_dua_paket()
returns trigger
language plpgsql
security definer
set search_path = public
as $esk$
declare
  v_paket record;
  v_sebelumnya uuid;
  v_ambang numeric;
  v_skor_ini numeric;
  v_skor_sebelumnya numeric;
  v_tutor uuid;
  v_min smallint;
  v_maks smallint;
  v_kelas_mulai smallint;
  v_kelas_anak integer;
begin
  if new.paket_topik_id is null then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select p.id, p.topik_id, p.jenis, p.nomor, p.level_bloom into v_paket
  from paket_topik p where p.id = new.paket_topik_id;

  if v_paket.jenis <> 'latihan' then return new; end if;

  select bloom_min, bloom_maks, kelas_mulai into v_min, v_maks, v_kelas_mulai
  from topik where id = v_paket.topik_id;

  -- TOPIK DI ATAS JENJANG ANAK TIDAK MEMANGGIL TUTOR (197). Misi menawarkan
  -- topik kelas di atas kelas anak sebagai pilihan yang boleh dicoba, dan nilai
  -- rendah di sana adalah hasil memilih sendiri sesuatu yang memang belum
  -- diajarkan — bukan anak yang tersendat di bahan kelasnya. Kalau tutor
  -- dipanggil untuk itu, orang tua dan tutor membaca sinyal palsu, dan anaknya
  -- merasa dinilai atas keberaniannya mencoba.
  --
  -- Kelas anak yang belum diisi (`profiles.grade` boleh kosong) atau kelas
  -- mulai topik yang belum diisi berarti perilakunya TIDAK berubah: eskalasi
  -- tetap lahir seperti sebelumnya. Menebak jenjang berarti membungkam alarm
  -- untuk anak yang mungkin sungguh butuh ditemani.
  select p.grade::integer
  into v_kelas_anak
  from learners l
  join profiles p on p.id = l.profile_id
  where l.id = new.learner_id;

  if v_kelas_mulai is not null and v_kelas_anak is not null
     and v_kelas_mulai > v_kelas_anak then
    return new;
  end if;

  -- Paket pengayaan tidak memicu apa pun.
  if v_min is not null and v_paket.level_bloom is not null
     and (v_paket.level_bloom < v_min or v_paket.level_bloom > v_maks) then
    return new;
  end if;

  -- SYARAT "PUTARAN PERTAMA SAJA" DICABUT (192). Selama pemicunya Skor
  -- Putaran 1, alarm memang hanya masuk akal pada putaran pertama. Sejak
  -- pemicunya nilai AKHIR, memeriksa cuma di putaran pertama berarti memanggil
  -- tutor untuk anak yang barusan mulai dan belum sempat memperbaiki apa pun —
  -- persis anak yang paling tidak butuh dipanggil. Sekarang tiap putaran yang
  -- ditutup ikut diperiksa, dan `on conflict do nothing` di bawah yang menjaga
  -- notifikasinya tidak lahir dua kali.

  -- Paket sebelumnya yang di dalam cakupan. Untuk topik yang mulai di C3
  -- (D-18), paket C2 bukan "paket sebelumnya" — ia bukan bagian dari
  -- kurikulum topik itu sama sekali.
  select p.id into v_sebelumnya
  from paket_topik p
  where p.topik_id = v_paket.topik_id
    and p.jenis = 'latihan'
    and p.nomor = v_paket.nomor - 1
    and (v_min is null or p.level_bloom is null
         or p.level_bloom between v_min and v_maks);

  if v_sebelumnya is null then return new; end if;

  select (nilai #>> '{}')::numeric into v_ambang
  from pengaturan where kunci = 'ambang_mastery';
  v_ambang := coalesce(v_ambang, 0.75);

  -- Nilai AKHIR, bukan Skor Putaran 1 (192) — dan hanya untuk paket yang
  -- seluruh butirnya sudah dijawab. Anak yang tersendat adalah anak yang sudah
  -- mencoba memperbaiki dan tetap di bawah ambang, bukan anak yang percobaan
  -- pertamanya jelek. Yang pertama butuh ditemani; yang kedua sedang belajar.
  select skor_akhir into v_skor_ini
  from skor_paket_topik(new.learner_id, new.paket_topik_id)
  where butir_paket > 0 and butir_terjawab >= butir_paket;
  select skor_akhir into v_skor_sebelumnya
  from skor_paket_topik(new.learner_id, v_sebelumnya)
  where butir_paket > 0 and butir_terjawab >= butir_paket;

  -- Paket yang belum selesai dikerjakan bukan paket yang gagal.
  if v_skor_ini is null or v_skor_sebelumnya is null then return new; end if;
  if v_skor_ini >= v_ambang or v_skor_sebelumnya >= v_ambang then return new; end if;

  select l.tutor_penanggung_jawab_id into v_tutor
  from learners l where l.id = new.learner_id;

  insert into notifikasi_eskalasi
    (learner_id, tutor_penanggung_jawab_id, pemicu, paket_pemicu,
     ambang_berlaku, skor_pemicu)
  values
    (new.learner_id, v_tutor, 'dua_paket_berturut_di_bawah_ambang',
     array[v_sebelumnya, new.paket_topik_id],
     v_ambang, array[v_skor_sebelumnya, v_skor_ini])
  on conflict (learner_id, pemicu, paket_pemicu) do nothing;

  return new;
end;
$esk$;

notify pgrst, 'reload schema';
