export interface AnalyzeRequest {
  resume: string;
  job_description: string;
}

export interface AnalyzeResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
  suggestions: string[];
}

export interface ApiError {
  error: string;
  message: string;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "message" in value
  );
}
