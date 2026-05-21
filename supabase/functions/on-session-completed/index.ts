import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  const payload = await req.json()
  const { record, old_record } = payload

  // Only process when status changes to 'completed'
  if (record.status !== 'completed' || old_record.status === 'completed') {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionId = record.id
  const tutorId = record.tutor_id
  const classId = record.class_id

  // Get salary scheme for this class + tutor
  const { data: scheme } = await supabase
    .from('salary_schemes')
    .select('*')
    .eq('class_id', classId)
    .eq('tutor_id', tutorId)
    .single()

  if (!scheme) {
    // No scheme configured — skip payment record creation
    return new Response(JSON.stringify({ skipped: 'no_scheme' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Count students who attended (present or late)
  const { count: presentCount } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .in('status', ['present', 'late'])

  let bonusAmount = 0
  if (
    scheme.bonus_type === 'student_count' &&
    scheme.bonus_threshold !== null &&
    (presentCount ?? 0) >= scheme.bonus_threshold
  ) {
    bonusAmount = scheme.bonus_amount
  }

  // Upsert payment record
  const { error } = await supabase.from('session_payments').upsert({
    session_id: sessionId,
    tutor_id: tutorId,
    base_amount: scheme.base_amount,
    bonus_amount: bonusAmount,
    status: 'pending',
  }, { onConflict: 'session_id,tutor_id' })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, bonus_amount: bonusAmount }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
