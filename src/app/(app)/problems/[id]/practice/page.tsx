"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import type { CodingProblem } from "@/components/interview/CodePanel";

const CodePanel = dynamic(() => import("@/components/interview/CodePanel"), {
  ssr: false,
});

export default function ProblemPracticePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing problem id");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/problems/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Problem not found" : "Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.problem) setProblem(data.problem);
        else if (!cancelled) setError("Problem not found");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading problem...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/problems")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Problems
          </button>
          <p className="text-destructive">{error ?? "Problem not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="shrink-0 border-b px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => router.push("/problems")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-muted-foreground">|</span>
        <span className="font-medium truncate">{String(problem.title)}</span>
      </div>
      <div className="flex-1 min-h-0">
        <CodePanel problem={problem} />
      </div>
    </div>
  );
}
