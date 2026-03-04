"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import InterviewSetup from "@/components/interview/InterviewSetup";
import type { InterviewSetupData } from "@/types/interview";

export default function InterviewPage() {
  const router = useRouter();

  const handleStart = (data: InterviewSetupData) => {
    console.log("[interview] Starting with data:", data);
    localStorage.setItem("interviewSetupData", JSON.stringify(data));
    router.push("/interview/live");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Interview Practice</h1>
          <p className="text-muted-foreground mt-2">
            Practice with an AI interviewer using real-time voice conversation
          </p>
        </div>
        <InterviewSetup onStart={handleStart} />
      </div>
    </div>
  );
}
