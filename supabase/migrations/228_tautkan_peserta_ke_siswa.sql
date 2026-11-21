-- ============================================================
-- Menautkan peserta try out (murid luar) ke akun siswa Tera
--
-- Murid luar masuk dengan `learners.access_code` dan barisnya `profile_id`
-- null (migrasi 227). Saat ia berlangganan dan punya akun Tera, admin
-- menautkannya di halaman "Peserta Try Out". Seluruh riwayat try out ikut
-- karena percobaan menunjuk ke `learners.id`, bukan ke nama.
--
-- Dua keadaan:
--   * Siswa BELUM punya baris `learners`: `profile_id` cukup diisi pada baris
--     peserta itu. Kodenya tetap berlaku.
--   * Siswa SUDAH punya baris (mis. pernah berlatih, `learner_for_me()`):
--     indeks unik `learners_profile_id_key` melarang dua baris satu profil,
--     jadi percobaan try out DIPINDAHKAN ke baris siswa dan kode peserta lama
--     dipensiunkan (dikosongkan). Data latihan di baris lama tidak disentuh.
--
-- Hanya service_role yang boleh memanggil (halaman admin Tera memakai kunci
-- layanan setelah memeriksa peran admin); anon dan authenticated dicabut.
-- ADITIF: hanya satu fungsi baru.
-- ============================================================

create or replace function tautkan_peserta_ke_siswa(p_learner uuid, p_profile uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_luar learners%rowtype;
  v_ada uuid;
begin
  select * into v_luar from learners where id = p_learner and profile_id is null for update;
  if not found then
    raise exception 'peserta_tidak_ditemukan' using errcode = 'P0002';
  end if;

  if not exists (select 1 from profiles where id = p_profile and role::text in ('student', 'mandiri')) then
    raise exception 'bukan_siswa' using errcode = 'P0001';
  end if;

  select id into v_ada from learners where profile_id = p_profile;

  if v_ada is null then
    update learners set profile_id = p_profile where id = p_learner;
    return 'tertaut';
  end if;

  update attempts set learner_id = v_ada where learner_id = p_learner;

  update learners
     set sekolah = coalesce(sekolah, v_luar.sekolah),
         jenjang = coalesce(jenjang, v_luar.jenjang),
         nama_wali = coalesce(nama_wali, v_luar.nama_wali),
         wa = coalesce(wa, v_luar.wa)
   where id = v_ada;

  update learners set access_code = null where id = p_learner;
  return 'digabung';
end $$;

revoke all on function tautkan_peserta_ke_siswa(uuid, uuid) from public, anon, authenticated;
grant execute on function tautkan_peserta_ke_siswa(uuid, uuid) to service_role;
