-- ============================================================
-- Bank soal disimpan per TOPIK, bukan per CP
--
-- `sessions.cp_urls` selama ini dikunci id `curriculum_topics` (satu baris CP =
-- satu capaian pembelajaran). Padahal satu topik biasanya punya beberapa CP,
-- dan bank soalnya satu untuk topik itu — jadi tutor menempelkan URL yang sama
-- berkali-kali, dan halaman "Materi dan Bank Soal" menampilkannya sebagai
-- beberapa baris berbeda yang isinya sama.
--
-- Setelah migrasi ini kuncinya adalah id `curriculum_topic_groups` (identitas
-- topik yang stabil, migrasi 060). Kolomnya sengaja tidak diganti nama:
-- `cp_urls` sudah dibaca di banyak tempat, dan mengganti nama kolom sekaligus
-- mengganti arti isinya membuat dua perubahan berisiko jadi satu.
--
-- Dua keputusan saat menggabungkan:
--
--   * Kalau beberapa CP dari satu topik punya URL berbeda, yang menang adalah
--     yang TIDAK kosong dan kuncinya paling kecil. Menggabung dua URL berbeda
--     jadi satu memang kehilangan satu; alternatifnya (menyimpan keduanya)
--     berarti mempertahankan model per-CP yang justru sedang dibuang.
--   * Kunci yang tidak bisa dipetakan (CP-nya sudah dihapus) DIBIARKAN apa
--     adanya, bukan dibuang. Kunci basi yang terlihat lebih baik daripada link
--     tutor yang hilang diam-diam; pembacanya sudah punya fallback label.
--
-- CP kustom (`custom-0`, `custom-1`, …) milik kelas privat digabung jadi satu
-- kunci `custom`: semuanya menempel pada satu topik bebas yang sama di sesi itu.
-- ============================================================

with expanded as (
  select
    s.id as session_id,
    kv.value as url,
    case
      when kv.key like 'custom-%' then 'custom'
      else coalesce(ct.group_id::text, kv.key)
    end as new_key,
    kv.key as old_key
  from sessions s
  cross join lateral jsonb_each_text(s.cp_urls) kv
  -- Perbandingan text, bukan cast kunci ke uuid: kunci `custom-0` bukan uuid
  -- dan cast-nya akan menggagalkan seluruh migrasi.
  left join curriculum_topics ct on ct.id::text = kv.key
  where s.cp_urls <> '{}'::jsonb
),
winners as (
  select distinct on (session_id, new_key)
    session_id, new_key, url
  from expanded
  order by session_id, new_key, (nullif(btrim(url), '') is null), old_key
),
merged as (
  select session_id, jsonb_object_agg(new_key, url) as new_urls
  from winners
  group by session_id
)
update sessions s
set cp_urls = merged.new_urls
from merged
where merged.session_id = s.id
  and s.cp_urls <> merged.new_urls;
