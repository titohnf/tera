import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tera Bimbel <noreply@terabimbel.com>',
      to,
      subject,
      html,
    }),
  })
  return res.ok
}

async function processReminders(windowStart: Date, windowEnd: Date, type: 'reminder_1d' | 'reminder_1h') {
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_at, topic,
      classes(name),
      tutor:profiles!tutor_id(id, full_name, email)
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_at', windowStart.toISOString())
    .lt('scheduled_at', windowEnd.toISOString())

  if (!sessions || sessions.length === 0) return

  for (const session of sessions) {
    const tutor = session.tutor as { id: string; full_name: string; email: string } | null
    if (!tutor?.email) continue

    // Check idempotency
    const { data: existing } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('recipient_id', tutor.id)
      .eq('session_id', session.id)
      .eq('type', type)
      .eq('channel', 'email')
      .single()

    if (existing) continue

    const cls = session.classes as { name: string } | null
    const sessionDate = new Date(session.scheduled_at)
    const timeLabel = type === 'reminder_1d' ? '24 jam' : '1 jam'

    const subject = `Pengingat: Kelas ${cls?.name ?? ''} dalam ${timeLabel}`
    const html = `
      <p>Halo ${tutor.full_name},</p>
      <p>Ini pengingat bahwa kelas <strong>${cls?.name ?? ''}</strong> akan dimulai dalam ${timeLabel}.</p>
      <ul>
        <li><strong>Tanggal:</strong> ${sessionDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</li>
        <li><strong>Waktu:</strong> ${sessionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</li>
        ${session.topic ? `<li><strong>Topik:</strong> ${session.topic}</li>` : ''}
      </ul>
      <p>Semangat mengajar!</p>
      <p>— Tim Tera Bimbel</p>
    `

    const sent = await sendEmail(tutor.email, subject, html)

    await supabase.from('notification_logs').insert({
      recipient_id: tutor.id,
      session_id: session.id,
      type,
      channel: 'email',
      status: sent ? 'sent' : 'failed',
    })
  }
}

Deno.serve(async () => {
  const now = new Date()

  // 24h window: sessions happening 23–25 hours from now
  const window1dStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const window1dEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  await processReminders(window1dStart, window1dEnd, 'reminder_1d')

  // 1h window: sessions happening 55–65 minutes from now
  const window1hStart = new Date(now.getTime() + 55 * 60 * 1000)
  const window1hEnd = new Date(now.getTime() + 65 * 60 * 1000)
  await processReminders(window1hStart, window1hEnd, 'reminder_1h')

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
