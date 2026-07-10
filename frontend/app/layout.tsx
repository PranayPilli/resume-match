import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Match — AI Resume vs. Job Description Analyzer",
  description:
    "Paste a resume and a job description to get a match score, overlapping skills, missing skills, and improvement suggestions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
