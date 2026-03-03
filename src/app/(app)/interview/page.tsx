"use client";

import { useRouter } from "next/navigation";
import InterviewSetup from "@/components/interview/InterviewSetup";
import type { InterviewSetupData } from "@layline/agents";

export default function InterviewPage() {
  const router = useRouter();

  const handleStart = (data: InterviewSetupData) => {
    localStorage.setItem("interviewSetupData", JSON.stringify(data));
    router.push("/interview/live");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
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
