/**
 * Seed data dummy untuk tutor Suci
 * Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-suci-dummy.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fkieereilqfiqtjmpher.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

function yyyyMM(monthsBack) {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsBack)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Senin=1 Rabu=3 Jumat=5 Sabtu=6
async function main() {
  // ─── 1. Cari tutor Suci ────────────────────────────────────────────────────
  console.log('1. Mencari tutor Suci...')
  const { data: tutors } = await sb
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'tutor')
    .ilike('full_name', '%suci%')

  if (!tutors || tutors.length === 0) {
    console.error('❌ Tutor bernama Suci tidak ditemukan. Buat dulu via /admin/users/new')
    process.exit(1)
  }
  const suci = tutors[0]
  const tutorId = suci.id
  console.log(`✅ Ditemukan: ${suci.full_name} (${tutorId})`)

  // ─── 2. Pastikan subjects ada ──────────────────────────────────────────────
  console.log('2. Menyiapkan mata pelajaran...')
  const subjectDefs = [
    { name: 'Matematika' },
    { name: 'IPA' },
    { name: 'Bahasa Inggris' },
  ]
  const subjectIds = {}
  for (const s of subjectDefs) {
    const { data: existing } = await sb.from('subjects').select('id').eq('name', s.name).single()
    if (existing) {
      subjectIds[s.name] = existing.id
    } else {
      const { data: created } = await sb.from('subjects').insert({ name: s.name }).select('id').single()
      subjectIds[s.name] = created.id
    }
    console.log(`  ✅ ${s.name}: ${subjectIds[s.name]}`)
  }

  // ─── 3. Tutor subjects (mapel + jenjang) ───────────────────────────────────
  console.log('3. Mengatur mapel yang diajar...')
  await sb.from('tutor_subjects').delete().eq('tutor_id', tutorId)
  const tutorSubjects = [
    { tutor_id: tutorId, subject_id: subjectIds['Matematika'], level: 'SD' },
    { tutor_id: tutorId, subject_id: subjectIds['Matematika'], level: 'SMP' },
    { tutor_id: tutorId, subject_id: subjectIds['IPA'], level: 'SMP' },
    { tutor_id: tutorId, subject_id: subjectIds['Bahasa Inggris'], level: 'SMP' },
    { tutor_id: tutorId, subject_id: subjectIds['Bahasa Inggris'], level: 'SMA' },
  ]
  const { error: tsErr } = await sb.from('tutor_subjects').insert(tutorSubjects)
  if (tsErr) console.error('  ❌', tsErr.message)
  else console.log(`  ✅ ${tutorSubjects.length} mapel diatur`)

  // ─── 4. Ketersediaan (availability) ───────────────────────────────────────
  console.log('4. Mengatur ketersediaan...')
  await sb.from('tutor_availability').delete().eq('tutor_id', tutorId)
  const availability = [
    { tutor_id: tutorId, day_of_week: 1, start_time: '09:00', end_time: '17:00' }, // Senin
    { tutor_id: tutorId, day_of_week: 2, start_time: '13:00', end_time: '18:00' }, // Selasa
    { tutor_id: tutorId, day_of_week: 3, start_time: '09:00', end_time: '17:00' }, // Rabu
    { tutor_id: tutorId, day_of_week: 5, start_time: '09:00', end_time: '15:00' }, // Jumat
    { tutor_id: tutorId, day_of_week: 6, start_time: '08:00', end_time: '12:00' }, // Sabtu
  ]
  const { error: avErr } = await sb.from('tutor_availability').insert(availability)
  if (avErr) console.error('  ❌', avErr.message)
  else console.log(`  ✅ ${availability.length} hari diatur`)

  // ─── 5. Buat dummy students ────────────────────────────────────────────────
  console.log('5. Menyiapkan siswa dummy...')
  const studentNames = [
    'Aldi Firmansyah', 'Budi Santoso', 'Citra Dewi', 'Dika Pratama',
    'Eka Putri', 'Fajar Nugroho', 'Gita Rahayu', 'Hendra Wijaya',
    'Indah Sari', 'Joko Susilo',
  ]
  const studentIds = []
  for (const name of studentNames) {
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}.dummy@tera.test`
    // cek sudah ada belum
    const { data: existing } = await sb.from('profiles').select('id').eq('email', email).single()
    if (existing) {
      studentIds.push(existing.id)
      console.log(`  ♻️  ${name} (sudah ada)`)
      continue
    }
    // buat auth user dulu
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email,
      password: 'dummy123456',
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (authErr) { console.error(`  ❌ ${name}:`, authErr.message); continue }
    // update profile
    await sb.from('profiles').update({
      full_name: name,
      role: 'student',
      level: ['SD', 'SMP', 'SMA'][Math.floor(Math.random() * 3)],
    }).eq('id', authData.user.id)
    studentIds.push(authData.user.id)
    console.log(`  ✅ ${name}`)
  }

  // ─── 6. Buat kelas aktif ───────────────────────────────────────────────────
  console.log('6. Membuat kelas aktif...')
  const activeClassDefs = [
    {
      name: 'Grup SMP A',
      subjectId: subjectIds['Matematika'],
      level: 'SMP',
      schedule_days: [1, 3], // Senin, Rabu
      schedule_time: '10:00',
      students: studentIds.slice(0, 4),
    },
    {
      name: 'Grup SMP B',
      subjectId: subjectIds['IPA'],
      level: 'SMP',
      schedule_days: [2, 5], // Selasa, Jumat
      schedule_time: '14:00',
      students: studentIds.slice(2, 7),
    },
    {
      name: 'Grup SD Matematika',
      subjectId: subjectIds['Matematika'],
      level: 'SD',
      schedule_days: [6], // Sabtu
      schedule_time: '09:00',
      students: studentIds.slice(6, 9),
    },
  ]

  const activeClassIds = []
  for (const def of activeClassDefs) {
    const { students, subjectId, ...classData } = def
    const { data: cls, error: clsErr } = await sb
      .from('classes')
      .insert({ ...classData, tutor_id: tutorId, is_active: true, base_price_per_session: 75000 })
      .select('id')
      .single()
    if (clsErr) { console.error(`  ❌ ${def.name}:`, clsErr.message); continue }

    // link subject via class_subjects
    await sb.from('class_subjects').upsert({ class_id: cls.id, subject_id: subjectId })

    // class slots
    for (const day of classData.schedule_days) {
      await sb.from('class_slots').insert({
        class_id: cls.id,
        slot_index: classData.schedule_days.indexOf(day),
        day_of_week: day,
        start_time: classData.schedule_time,
        tutor_id: tutorId,
        subject_ids: [subjectId],
      })
    }

    activeClassIds.push({ id: cls.id, name: def.name, students })
    // enroll students
    const enrollments = students.map(sid => ({ class_id: cls.id, student_id: sid, is_active: true }))
    await sb.from('class_students').insert(enrollments)
    console.log(`  ✅ ${def.name} (${students.length} siswa)`)
  }

  // ─── 7. Buat kelas tidak aktif (riwayat) ──────────────────────────────────
  console.log('7. Membuat kelas historis (nonaktif)...')
  const inactiveClassDefs = [
    { name: 'Kelas Bahasa Inggris SMA', subjectId: subjectIds['Bahasa Inggris'], level: 'SMA' },
    { name: 'Bimbel SD Semester 1', subjectId: subjectIds['Matematika'], level: 'SD' },
  ]
  for (const def of inactiveClassDefs) {
    const { subjectId, ...classData } = def
    const { data: cls, error } = await sb.from('classes').insert({
      ...classData,
      tutor_id: tutorId,
      is_active: false,
      base_price_per_session: 65000,
      schedule_days: [],
    }).select('id').single()
    if (error) { console.error(`  ❌ ${def.name}:`, error.message); continue }
    await sb.from('class_subjects').upsert({ class_id: cls.id, subject_id: subjectId })
    console.log(`  ✅ ${def.name} (nonaktif)`)
  }

  // ─── 8. Buat sesi dan kehadiran ────────────────────────────────────────────
  console.log('8. Membuat sesi dan kehadiran...')
  let totalSessions = 0
  for (const cls of activeClassIds) {
    // 6 sesi terakhir, tiap 1 minggu sekali
    for (let i = 6; i >= 1; i--) {
      const scheduledAt = daysAgo(i * 7)
      const { data: session, error: sessErr } = await sb
        .from('sessions')
        .insert({
          class_id: cls.id,
          tutor_id: tutorId,
          scheduled_at: scheduledAt,
          duration_minutes: 90,
          status: 'completed',
          topic: ['Aljabar dasar', 'Geometri', 'Statistika', 'Persamaan linear', 'Bilangan bulat', 'Pecahan'][i - 1],
        })
        .select('id')
        .single()
      if (sessErr) { console.error(`  ❌ sesi:`, sessErr.message); continue }
      // attendance: 80% hadir
      const attendances = cls.students.map((sid, idx) => ({
        session_id: session.id,
        student_id: sid,
        status: idx % 5 === 0 ? 'absent' : 'present',
      }))
      await sb.from('attendances').insert(attendances)
      totalSessions++
    }
  }
  console.log(`  ✅ ${totalSessions} sesi dengan kehadiran`)

  // ─── 9. Buat slip gaji ─────────────────────────────────────────────────────
  console.log('9. Membuat slip gaji...')
  const payslipData = [
    { month: yyyyMM(0), status: 'draft',  grand_total: 0,       total_sessions: 0 },
    { month: yyyyMM(1), status: 'sent',   grand_total: 2850000, total_sessions: 12 },
    { month: yyyyMM(2), status: 'paid',   grand_total: 3150000, total_sessions: 14 },
    { month: yyyyMM(3), status: 'paid',   grand_total: 2700000, total_sessions: 12 },
    { month: yyyyMM(4), status: 'paid',   grand_total: 3000000, total_sessions: 13 },
    { month: yyyyMM(5), status: 'paid',   grand_total: 2550000, total_sessions: 11 },
  ]
  for (const [i, slip] of payslipData.entries()) {
    const payslipNumber = `PS-${slip.month}-001`
    const { error } = await sb.from('payslips').upsert({
      payslip_number: payslipNumber,
      tutor_id: tutorId,
      tutor_name: suci.full_name,
      month: slip.month,
      pay_date: slip.month + '-01',
      total_sessions: slip.total_sessions,
      base_total: slip.grand_total,
      bonus_total: 0,
      grand_total: slip.grand_total,
      line_items: [],
      status: slip.status,
    }, { onConflict: 'tutor_id,month' })
    if (error) console.error(`  ❌ ${slip.month}:`, error.message)
    else console.log(`  ✅ ${slip.month} (${slip.status}) – Rp ${slip.grand_total.toLocaleString('id-ID')}`)
  }

  // ─── Done ──────────────────────────────────────────────────────────────────
  console.log('\n🎉 Selesai! Buka detail tutor Suci di /admin/tutor')
}

main().catch(e => { console.error(e); process.exit(1) })
