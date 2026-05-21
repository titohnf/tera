-- Seed performance note templates (system templates, created_by = null)
insert into performance_note_templates (created_by, category, label, body) values
-- Attitude
(null, 'Attitude', 'Aktif & Antusias', '{{student_name}} sangat aktif dan antusias selama sesi berlangsung. Pertahankan semangat belajarnya!'),
(null, 'Attitude', 'Perlu Lebih Fokus', '{{student_name}} perlu meningkatkan fokus selama sesi. Disarankan untuk mengurangi gangguan saat belajar.'),
(null, 'Attitude', 'Disiplin Waktu', '{{student_name}} hadir tepat waktu dan mengikuti sesi dengan tertib.'),
(null, 'Attitude', 'Kurang Partisipasi', '{{student_name}} cenderung pasif hari ini. Perlu didorong untuk lebih aktif bertanya dan menjawab.'),
-- Progress
(null, 'Progress', 'Menguasai Materi', '{{student_name}} sudah menguasai materi hari ini dengan baik. Lanjutkan ke topik berikutnya.'),
(null, 'Progress', 'Butuh Pengulangan', '{{student_name}} perlu pengulangan pada materi hari ini. Disarankan belajar ulang sebelum sesi berikutnya.'),
(null, 'Progress', 'Kemajuan Signifikan', '{{student_name}} menunjukkan kemajuan yang signifikan dibandingkan sesi sebelumnya. Kerja bagus!'),
(null, 'Progress', 'Kesulitan Konsep Dasar', '{{student_name}} masih kesulitan pada konsep dasar. Perlu perhatian lebih dan latihan tambahan.'),
(null, 'Progress', 'Nilai Asesmen Baik', '{{student_name}} berhasil mengerjakan asesmen hari ini dengan hasil memuaskan.'),
-- Recommendation
(null, 'Recommendation', 'Perbanyak Latihan Soal', 'Disarankan agar {{student_name}} memperbanyak latihan soal mandiri sebelum sesi berikutnya.'),
(null, 'Recommendation', 'Review Materi di Rumah', '{{student_name}} disarankan untuk me-review materi yang telah disampaikan sebelum sesi berikutnya.'),
(null, 'Recommendation', 'Kerjakan PR Tepat Waktu', '{{student_name}} diingatkan untuk mengerjakan PR dan mengumpulkan tepat waktu.'),
(null, 'Recommendation', 'Konsultasi Tambahan', 'Disarankan {{student_name}} untuk mengambil sesi konsultasi tambahan untuk memperkuat pemahaman.'),
(null, 'Recommendation', 'Siap Ujian', '{{student_name}} sudah siap untuk menghadapi ujian berdasarkan progres belajar hari ini.');
