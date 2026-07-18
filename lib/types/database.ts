// Manual type stub — replace with: supabase gen types typescript --local > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'tutor' | 'student' | 'parent'
export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled'
export type BonusType = 'student_count' | 'none'

// ---- Row types ----

export interface ProfileRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  level: string | null
  grade: number | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface SubjectRow {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface ClassRow {
  id: string
  name: string
  subject_id: string | null
  tutor_id: string
  base_price_per_session: number
  level: string | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
  duration_minutes: number
  created_at: string
  updated_at: string
}

export interface ClassStudentRow {
  id: string
  class_id: string
  student_id: string
  enrolled_at: string
  is_active: boolean
}

export interface SessionRow {
  id: string
  class_id: string
  tutor_id: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: SessionStatus
  topic: string | null
  selected_cp_ids: string[]
  custom_theme: string | null
  custom_learning_outcomes: string[] | null
  created_at: string
  updated_at: string
}

export interface AttendanceRow {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  marked_by: string | null
  marked_at: string
  notes: string | null
}

export interface MaterialRow {
  id: string
  session_id: string
  uploaded_by: string
  title: string
  file_path: string
  file_size_bytes: number | null
  mime_type: string | null
  created_at: string
}

export interface AssessmentRow {
  id: string
  session_id: string
  created_by: string
  title: string
  description: string | null
  max_score: number
  due_at: string | null
  created_at: string
}

export interface AssessmentResultRow {
  id: string
  assessment_id: string
  student_id: string
  score: number | null
  feedback: string | null
  graded_by: string | null
  graded_at: string | null
}

export interface PerformanceNoteTemplateRow {
  id: string
  created_by: string | null
  category: string
  label: string
  body: string
  is_active: boolean
  created_at: string
}

export interface PerformanceNoteRow {
  id: string
  session_id: string
  student_id: string
  tutor_id: string
  template_id: string | null
  body: string
  created_at: string
  updated_at: string
}

export interface SalarySchemeRow {
  id: string
  class_id: string
  tutor_id: string
  base_amount: number
  bonus_type: BonusType
  bonus_threshold: number | null
  bonus_amount: number
  effective_from: string
  created_at: string
}

export interface SessionPaymentRow {
  id: string
  session_id: string
  tutor_id: string
  base_amount: number
  bonus_amount: number
  total_amount: number
  status: PaymentStatus
  paid_at: string | null
  payment_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PayslipLineItem {
  sessionId: string
  scheduledAt: string
  className: string
  topic: string | null
  studentsPresent: number
  baseAmount: number
  bonusAmount: number
  totalAmount: number
}

export interface PayslipRow {
  id: string
  payslip_number: string
  tutor_id: string
  tutor_name: string
  month: string
  pay_date: string
  total_sessions: number
  base_total: number
  bonus_total: number
  grand_total: number
  line_items: PayslipLineItem[]
  status: 'draft' | 'sent' | 'paid'
  notes: string | null
  sent_at: string | null
  paid_at: string | null
  payment_reference: string | null
  is_deleted: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface NotificationLogRow {
  id: string
  recipient_id: string
  session_id: string
  type: 'reminder_1d' | 'reminder_1h' | 'custom'
  channel: 'push' | 'email'
  sent_at: string
  status: 'sent' | 'failed'
}

// ---- Database schema type ----

export interface Database {
  public: {
    Views: Record<string, never>
    Enums: {
      user_role: UserRole
      session_status: SessionStatus
      attendance_status: AttendanceStatus
      payment_status: PaymentStatus
      bonus_type: BonusType
    }
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>
      }
      subjects: {
        Row: SubjectRow
        Insert: Omit<SubjectRow, 'id' | 'created_at'>
        Update: Partial<Omit<SubjectRow, 'id' | 'created_at'>>
      }
      classes: {
        Row: ClassRow
        Insert: Omit<ClassRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClassRow, 'id' | 'created_at' | 'updated_at'>>
      }
      class_students: {
        Row: ClassStudentRow
        Insert: Omit<ClassStudentRow, 'id' | 'enrolled_at'>
        Update: Partial<Omit<ClassStudentRow, 'id' | 'enrolled_at'>>
      }
      sessions: {
        Row: SessionRow
        Insert: Omit<SessionRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SessionRow, 'id' | 'created_at' | 'updated_at'>>
      }
      attendances: {
        Row: AttendanceRow
        Insert: Omit<AttendanceRow, 'id' | 'marked_at'>
        Update: Partial<Omit<AttendanceRow, 'id' | 'marked_at'>>
      }
      materials: {
        Row: MaterialRow
        Insert: Omit<MaterialRow, 'id' | 'created_at'>
        Update: Partial<Omit<MaterialRow, 'id' | 'created_at'>>
      }
      assessments: {
        Row: AssessmentRow
        Insert: Omit<AssessmentRow, 'id' | 'created_at'>
        Update: Partial<Omit<AssessmentRow, 'id' | 'created_at'>>
      }
      assessment_results: {
        Row: AssessmentResultRow
        Insert: Omit<AssessmentResultRow, 'id'>
        Update: Partial<Omit<AssessmentResultRow, 'id'>>
      }
      performance_note_templates: {
        Row: PerformanceNoteTemplateRow
        Insert: Omit<PerformanceNoteTemplateRow, 'id' | 'created_at'>
        Update: Partial<Omit<PerformanceNoteTemplateRow, 'id' | 'created_at'>>
      }
      performance_notes: {
        Row: PerformanceNoteRow
        Insert: Omit<PerformanceNoteRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PerformanceNoteRow, 'id' | 'created_at' | 'updated_at'>>
      }
      salary_schemes: {
        Row: SalarySchemeRow
        Insert: Omit<SalarySchemeRow, 'id' | 'created_at'>
        Update: Partial<Omit<SalarySchemeRow, 'id' | 'created_at'>>
      }
      session_payments: {
        Row: SessionPaymentRow
        Insert: Omit<SessionPaymentRow, 'id' | 'total_amount' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SessionPaymentRow, 'id' | 'total_amount' | 'created_at' | 'updated_at'>>
      }
      notification_logs: {
        Row: NotificationLogRow
        Insert: Omit<NotificationLogRow, 'id' | 'sent_at'>
        Update: Partial<Omit<NotificationLogRow, 'id' | 'sent_at'>>
      }
      payslips: {
        Row: PayslipRow
        Insert: Omit<PayslipRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PayslipRow, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

// ---- Convenience aliases ----

export type Profile = ProfileRow
export type Subject = SubjectRow
export type Class = ClassRow
export type ClassStudent = ClassStudentRow
export type Session = SessionRow
export type Attendance = AttendanceRow
export type Material = MaterialRow
export type Assessment = AssessmentRow
export type AssessmentResult = AssessmentResultRow
export type PerformanceNoteTemplate = PerformanceNoteTemplateRow
export type PerformanceNote = PerformanceNoteRow
export type SalaryScheme = SalarySchemeRow
export type SessionPayment = SessionPaymentRow
export type Payslip = PayslipRow

// ---- Extended types with joins ----

export type SessionWithClass = SessionRow & {
  classes: Pick<ClassRow, 'name' | 'level' | 'base_price_per_session'>
}

export type AttendanceWithStudent = AttendanceRow & {
  profiles: Pick<ProfileRow, 'full_name' | 'avatar_url'>
}

export type SessionPaymentWithSession = SessionPaymentRow & {
  sessions: Pick<SessionRow, 'scheduled_at' | 'topic'> & {
    classes: Pick<ClassRow, 'name'>
  }
}
