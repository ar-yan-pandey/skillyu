export type MasterclassType = 'free' | 'paid'
export type PrerequisiteType = 'none' | 'beginner' | 'intermediate' | 'advanced'

export type MasterclassCategory = 
  | 'technology'
  | 'marketing'
  | 'finance'
  | 'design'
  | 'business'
  | 'personal_development'
  | 'data_science'
  | 'artificial_intelligence'
  | 'entrepreneurship'
  | 'leadership'
  | 'others'

export interface Prerequisites {
  type: PrerequisiteType
  details: string | null
}

export interface Masterclass {
  id: string
  title: string
  image_url: string | null
  mentor_name: string
  description: string
  type: MasterclassType
  category: MasterclassCategory
  fee: number | null
  prerequisites: Prerequisites
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  meeting_link: string | null
  visible_meeting_link: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface MasterclassRegistration {
  id: string
  user_id: string
  masterclass_id: string
  status: 'registered' | 'attended' | 'missed'
  payment_status: 'not_required' | 'pending' | 'completed' | 'failed'
  payment_id: string | null
  created_at: string
  updated_at: string
}
