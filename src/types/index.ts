export type JobStatus = 'open' | 'paused' | 'closed';

export type PipelineStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected';

export type InterviewType = 'screening' | 'technical' | 'hr' | 'final';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  modality: string;
  status: JobStatus;
  description: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  min_experience_years: number;
  salary_range?: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  source: string;
  years_experience: number;
  skills: string[];
  cv_text: string;
  cv_url?: string;
  cv_filename?: string;
  notes?: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  stage: PipelineStage;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  rejection_reason?: string;
  applied_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  type: InterviewType;
  scheduled_at: string;
  interviewer: string;
  location_or_link: string;
  status: InterviewStatus;
  feedback?: string;
  rating?: number;
  created_at: string;
}

export const STAGE_LABELS: Record<PipelineStage, string> = {
  applied: 'Postulado',
  screening: 'Screening',
  interview: 'Entrevista',
  offer: 'Oferta',
  hired: 'Contratado',
  rejected: 'Descartado',
};

export const STAGE_COLORS: Record<PipelineStage, string> = {
  applied: 'bg-[#FCF2E4] text-[#11314E] border-[#EAD9C4]',
  screening: 'bg-[#EBF2F7] text-[#11314E] border-[#C2D8E9]',
  interview: 'bg-[#FDEEE9] text-[#EC623E] border-[#FCD5CA]',
  offer: 'bg-amber-50 text-amber-800 border-amber-200',
  hired: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export type ActivityActionType =
  | 'stage_changed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'candidate_created'
  | 'candidate_rejected';

export interface ActivityLog {
  id: string;
  created_at: string;
  user_name: string;
  user_role: string;
  action_type: ActivityActionType;
  title: string;
  details?: string;
  candidate_id?: string;
  candidate_name?: string;
  job_title?: string;
}
