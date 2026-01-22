export interface Coach {
  id: string;
  salesforce_id: string | null;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  timezone: string;
  is_scale_coach: boolean;
  is_grow_coach: boolean;
  is_exec_coach: boolean;
  is_complimentary_pilot: boolean;
  is_paid_pilot: boolean;
  icf_level: string | null;
  created_date: string;
  active_client_count: number;
  special_services: string;
  specialties: string | null;
  industries: string | null;
  companies: string | null;
  seniority_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  photo_url: string;
  practitioner_type: string | null;
  bio: string;
  notable_credentials: string | null;
  headline: string | null;
}

export interface ParsedRequirements {
  seniority_level: string;
  industry: string | null;
  gender_preference: string | null;
  key_focus_areas: string[];
  other_notes: string | null;
}

export interface CoachRecommendation {
  name: string;
  match_score: number;
  rationale: string;
  key_strengths: string[];
  potential_concerns: string | null;
}

export interface MatchResult {
  parsed_requirements: ParsedRequirements;
  recommendations: CoachRecommendation[];
}
