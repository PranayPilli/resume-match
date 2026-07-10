import { AnalyzeRequest, AnalyzeResult, ApiError, isApiError } from "./types";

// Set NEXT_PUBLIC_API_URL in .env.local for local dev (e.g. http://localhost:5000)
// and in your Vercel project settings for production (your Render URL).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function extractResumeFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/extract-resume`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "Could not reach the server to read your file. Check that the backend is running."
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }

  if (!response.ok) {
    const message = isApiError(data as ApiError)
      ? (data as ApiError).message
      : "Could not read that file.";
    throw new Error(message);
  }

  return (data as { text: string }).text;
}

export async function analyzeResume(
  payload: AnalyzeRequest
): Promise<AnalyzeResult> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Could not reach the analysis server. Check that the backend is running and NEXT_PUBLIC_API_URL is set correctly."
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }

  if (!response.ok) {
    const message = isApiError(data as ApiError)
      ? (data as ApiError).message
      : "Something went wrong while analyzing your resume.";
    throw new Error(message);
  }

  return data as AnalyzeResult;
}
