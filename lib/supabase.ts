import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface AIPolicy {
  id: string
  policy_name: string
  jurisdiction?: string
  issuing_body?: string
  date_introduced?: string
  date_enacted?: string
  status?: 'Proposed' | 'Under Review' | 'Enacted' | 'Amended' | 'Repealed' | 'Expired'
  policy_type?: string
  scope_coverage?: string
  key_provisions?: string
  risk_classification?: 'Low' | 'Medium' | 'High' | 'Critical'
  company_obligations?: string
  penalties_fines?: string
  affected_stakeholders?: string
  implementation_notes?: string
  latest_update?: string
  source_reference_link?: string
  monitoring_org?: string
  notes_commentary?: string
  next_review_date?: string
  confidence_score?: number
  created_at: string
  updated_at: string
}
