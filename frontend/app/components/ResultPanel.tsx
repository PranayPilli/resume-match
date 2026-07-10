"use client";

import { AnalyzeResult } from "../lib/types";

interface ResultPanelProps {
  result: AnalyzeResult;
}

function scoreColor(score: number): { stroke: string; text: string; label: string } {
  if (score >= 80) return { stroke: "#1F8A5A", text: "text-good", label: "Strong match" };
  if (score >= 50) return { stroke: "#B7841E", text: "text-warn", label: "Partial match" };
  return { stroke: "#C1502E", text: "text-bad", label: "Weak match" };
}

function ScoreGauge({ score }: { score: number }) {
  const { stroke, text, label } = scoreColor(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#DDE1E6" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl text-ink">{score}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate">/ 100</span>
        </div>
      </div>
      <p className={`mt-3 font-mono text-xs uppercase tracking-widest ${text}`}>{label}</p>
    </div>
  );
}

function SkillList({
  title,
  skills,
  variant,
}: {
  title: string;
  skills: string[];
  variant: "match" | "gap";
}) {
  const isMatch = variant === "match";
  return (
    <div className="flex-1">
      <p className="font-mono text-xs uppercase tracking-widest text-slate mb-3">
        {title} <span className="text-ink/40">({skills.length})</span>
      </p>
      {skills.length === 0 ? (
        <p className="text-sm text-slate italic">None identified.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <span
              key={i}
              className={
                isMatch
                  ? "rounded-full border border-match/30 bg-matchSoft px-3 py-1 text-xs font-body text-match"
                  : "rounded-full border border-dashed border-gap/40 bg-gapSoft px-3 py-1 text-xs font-body text-gap"
              }
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div className="w-full rounded-lg border border-line bg-white/70 p-6 md:p-8 paper-texture">
      <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
        <ScoreGauge score={result.match_score} />

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-slate mb-2">Summary</p>
          <p className="font-display text-lg leading-relaxed text-ink">{result.summary}</p>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-8 border-t border-line pt-8">
        <SkillList title="Matching skills" skills={result.matching_skills} variant="match" />
        <SkillList title="Missing skills" skills={result.missing_skills} variant="gap" />
      </div>

      {result.suggestions.length > 0 && (
        <div className="mt-8 border-t border-line pt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-slate mb-4">
            Suggestions to improve the match
          </p>
          <ul className="space-y-3">
            {result.suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink">
                <span className="font-mono text-slate/50 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
