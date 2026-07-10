"use client";

import { useRef, useState } from "react";
import { extractResumeFile } from "../lib/api";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "../lib/sampleData";

interface AnalyzerFormProps {
  onSubmit: (resume: string, jobDescription: string) => void;
  isLoading: boolean;
}

export default function AnalyzerForm({ onSubmit, isLoading }: AnalyzerFormProps) {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fillSample = () => {
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setFileName(null);
    setExtractError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractError(null);
    setIsExtracting(true);
    setFileName(file.name);

    try {
      const text = await extractResumeFile(file);
      setResume(text);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Could not read that file.");
      setFileName(null);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearFile = () => {
    setFileName(null);
    setResume("");
    setExtractError(null);
  };

  const canSubmit =
    resume.trim().length > 0 && jobDescription.trim().length > 0 && !isLoading && !isExtracting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(resume.trim(), jobDescription.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-baseline justify-between mb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-slate">
          Step 1 — Add both documents
        </p>
        <button
          type="button"
          onClick={fillSample}
          className="font-mono text-xs uppercase tracking-widest text-match hover:text-ink transition-colors underline decoration-dotted underline-offset-4"
        >
          Fill sample data
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="resume" className="font-display text-lg text-ink">
              Resume
            </label>
            <label
              htmlFor="resume-file"
              className="font-mono text-[11px] uppercase tracking-widest text-match hover:text-ink transition-colors cursor-pointer underline decoration-dotted underline-offset-4"
            >
              {isExtracting ? "Reading file…" : "Upload PDF / DOCX"}
            </label>
            <input
              ref={fileInputRef}
              id="resume-file"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
              disabled={isExtracting}
            />
          </div>

          {fileName && (
            <div className="mb-2 flex items-center justify-between rounded-md border border-match/30 bg-matchSoft px-3 py-1.5">
              <span className="font-mono text-[11px] text-match truncate">{fileName}</span>
              <button
                type="button"
                onClick={clearFile}
                className="font-mono text-[11px] text-slate hover:text-ink ml-2 shrink-0"
              >
                Remove
              </button>
            </div>
          )}

          {extractError && (
            <p className="mb-2 font-mono text-[11px] text-gap">{extractError}</p>
          )}

          <textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Upload a file above, or paste the full resume text here…"
            rows={13}
            className="w-full resize-y rounded-md border border-line bg-white/70 p-4 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus:border-match focus:ring-1 focus:ring-match outline-none transition-colors font-body"
          />
          <span className="mt-1 font-mono text-[11px] text-slate">
            {resume.length.toLocaleString()} chars
          </span>
        </div>

        <div className="flex flex-col">
          <label htmlFor="job-description" className="font-display text-lg mb-2 text-ink">
            Job description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here…"
            rows={14}
            className="w-full resize-y rounded-md border border-line bg-white/70 p-4 text-sm leading-relaxed text-ink placeholder:text-slate/60 focus:border-match focus:ring-1 focus:ring-match outline-none transition-colors font-body"
          />
          <span className="mt-1 font-mono text-[11px] text-slate">
            {jobDescription.length.toLocaleString()} chars
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 font-body text-sm font-medium text-paper transition-all hover:bg-match disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
        >
          {isLoading ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-paper" />
              Analyzing…
            </>
          ) : (
            "Analyze match"
          )}
        </button>
        <p className="font-mono text-[11px] text-slate">
          Powered by the Gemini API
        </p>
      </div>
    </form>
  );
}
