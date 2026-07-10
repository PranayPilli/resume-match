"use client";

import { useState } from "react";
import AnalyzerForm from "./components/AnalyzerForm";
import ResultPanel from "./components/ResultPanel";
import { analyzeResume } from "./lib/api";
import { AnalyzeResult } from "./lib/types";

export default function Home() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (resume: string, jobDescription: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeResume({ resume, job_description: jobDescription });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper paper-texture">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-match mb-3">
            Resume ↔ Job Description
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
            See exactly where your resume overlaps —
            <br className="hidden md:block" /> and where it doesn&apos;t.
          </h1>
          <p className="mt-4 max-w-xl text-slate leading-relaxed">
            Paste a resume and a job description below. An LLM reads both and
            returns a match score, the skills you share, the gaps, and what to
            fix.
          </p>
        </header>

        <AnalyzerForm onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <div className="mt-8 rounded-md border border-bad/30 bg-gapSoft px-5 py-4">
            <p className="font-mono text-xs uppercase tracking-widest text-bad mb-1">
              Analysis failed
            </p>
            <p className="text-sm text-ink">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mt-10 flex items-center gap-3 text-slate">
            <span className="h-2 w-2 animate-ping rounded-full bg-match" />
            <p className="font-mono text-xs uppercase tracking-widest">
              Reading both documents…
            </p>
          </div>
        )}

        {result && !isLoading && (
          <div className="mt-10">
            <ResultPanel result={result} />
          </div>
        )}

        <footer className="mt-20 border-t border-line pt-6">
          <p className="font-mono text-[11px] text-slate">
            Next.js · Flask · Gemini API — each analysis is stateless, nothing is stored.
          </p>
        </footer>
      </div>
    </main>
  );
}
