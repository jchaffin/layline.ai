"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TranscriptProvider, EventProvider } from "@jchaffin/voicekit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Mic,
  MicOff,
  Square,
  Send,
  Bot,
  User,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { useInterviewSession } from "@layline/agents/hooks";
import type { InterviewSetupData, FeedbackItem } from "@layline/agents";
import type { TranscriptItem } from "@jchaffin/voicekit";

function LiveSession() {
  const router = useRouter();
  const {
    sessionStatus,
    isConnected,
    isResearching,
    transcriptItems,
    feedbackItems,
    coachSuggestions,
    coachWarnings,
    interviewEnded,
    setupData,
    startInterview,
    endInterview,
    sendMessage,
    toggleMute,
    coachStatus,
  } = useInterviewSession();

  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [started, setStarted] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptItems]);

  useEffect(() => {
    if (started) return;
    const raw = localStorage.getItem("interviewSetupData");
    if (!raw) {
      router.replace("/interview");
      return;
    }
    setStarted(true);
    const data: InterviewSetupData = JSON.parse(raw);
    localStorage.removeItem("interviewSetupData");
    startInterview(data);
  }, [started, router, startInterview]);

  const handleEnd = () => {
    endInterview();
  };

  const handleRestart = () => {
    router.push("/interview");
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    toggleMute(next);
  };

  const handleSendText = () => {
    const text = textInput.trim();
    if (!text) return;
    sendMessage(text);
    setTextInput("");
  };

  if (interviewEnded) {
    return (
      <ReviewScreen
        feedbackItems={feedbackItems}
        transcriptItems={transcriptItems}
        setupData={setupData}
        onRestart={handleRestart}
      />
    );
  }

  const visibleItems = transcriptItems.filter(
    (item) => !item.isHidden && item.type === "MESSAGE",
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Interview Practice</h1>
            <ConnectionBadge status={sessionStatus} />
            {setupData?.companyName && (
              <span className="text-sm text-muted-foreground">
                {setupData.companyName}
                {setupData.roleTitle && ` — ${setupData.roleTitle}`}
              </span>
            )}
          </div>
          <Button variant="destructive" size="sm" onClick={handleEnd}>
            <Square className="w-4 h-4 mr-2" />
            End Interview
          </Button>
        </div>
      </div>

      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {visibleItems.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground space-y-2">
                  {isResearching ? (
                    <>
                      <p className="animate-pulse font-medium">Researching company...</p>
                      <p className="text-sm">Gathering context from knowledge base and web</p>
                    </>
                  ) : sessionStatus === "CONNECTING" ? (
                    <p className="animate-pulse">Connecting to interviewer...</p>
                  ) : sessionStatus === "DISCONNECTED" ? (
                    <div className="space-y-3">
                      <p>Disconnected.</p>
                      <Button size="sm" variant="outline" onClick={handleRestart}>
                        Back to Setup
                      </Button>
                    </div>
                  ) : (
                    <p>Your interview will begin shortly. The AI will speak first.</p>
                  )}
                </div>
              </div>
            )}
            {visibleItems.map((item) => (
              <TranscriptBubble key={item.itemId} item={item} />
            ))}
            <div ref={transcriptEndRef} />
          </div>

          <div className="border-t px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={handleMuteToggle}
                disabled={!isConnected}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder="Type a response instead..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendText}
                disabled={!isConnected || !textInput.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-96 border-l overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Coach
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                coachStatus === "responding"
                  ? "bg-green-100 text-green-700 animate-pulse"
                  : coachStatus === "thinking"
                    ? "bg-yellow-100 text-yellow-700 animate-pulse"
                    : coachStatus === "listening"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
              }`}
            >
              {coachStatus === "responding"
                ? "Responding"
                : coachStatus === "thinking"
                  ? "Thinking"
                  : coachStatus === "listening"
                    ? "Listening"
                    : "Idle"}
            </span>
          </div>

          {setupData && <ContextPanel setupData={setupData} />}

          <div className="space-y-3">
            {coachSuggestions.map((s, i) => (
              <div
                key={s.timestamp}
                className={`p-3 rounded-lg text-sm leading-relaxed border ${
                  i === 0
                    ? "bg-primary/5 border-primary/20 text-foreground"
                    : "bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                {s.response}
                {s.streaming && (
                  <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            ))}
          </div>

          {coachWarnings.length > 0 && (
            <div className="space-y-2">
              {coachWarnings.map((w, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
                >
                  {w.warning}
                </div>
              ))}
            </div>
          )}

          {feedbackItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Feedback</h4>
              {feedbackItems.map((fb, i) => (
                <FeedbackCard key={i} feedback={fb} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextPanel({ setupData }: { setupData: InterviewSetupData }) {
  const a = setupData.analysis;

  return (
    <div className="space-y-2.5 p-3 rounded-lg bg-muted/50 border border-border text-xs max-h-80 overflow-y-auto">
      <h4 className="font-semibold text-muted-foreground uppercase tracking-wider">Context</h4>

      {setupData.companyName && (
        <div><span className="font-medium">Company:</span> {setupData.companyName}</div>
      )}
      {setupData.roleTitle && (
        <div><span className="font-medium">Role:</span> {setupData.roleTitle}</div>
      )}
      {a?.experienceLevel && (
        <div><span className="font-medium">Level:</span> {a.experienceLevel}</div>
      )}
      {a?.workType && (
        <div><span className="font-medium">Work Type:</span> {a.workType}</div>
      )}
      {a?.companyInfo && (
        <div>
          <span className="font-medium">About</span>
          <p className="mt-0.5 text-muted-foreground">{a.companyInfo}</p>
        </div>
      )}
      {a?.requiredSkills && a.requiredSkills.length > 0 && (
        <div>
          <span className="font-medium">Required Skills</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {a.requiredSkills.map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-foreground/10 text-foreground">{s}</span>
            ))}
          </div>
        </div>
      )}
      {a?.preferredSkills && a.preferredSkills.length > 0 && (
        <div>
          <span className="font-medium">Preferred Skills</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {a.preferredSkills.map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
            ))}
          </div>
        </div>
      )}
      {a?.qualifications && a.qualifications.length > 0 && (
        <div>
          <span className="font-medium">Qualifications</span>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {a.qualifications.map((q, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      {a?.responsibilities && a.responsibilities.length > 0 && (
        <div>
          <span className="font-medium">Responsibilities</span>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {a.responsibilities.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!a && setupData.jobDescription && (
        <div>
          <span className="font-medium">Job Description</span>
          <p className="mt-0.5 text-muted-foreground whitespace-pre-line">{setupData.jobDescription}</p>
        </div>
      )}
    </div>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  if (status === "CONNECTED") {
    return (
      <Badge variant="default" className="bg-green-600 text-white text-xs">
        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
        Live
      </Badge>
    );
  }
  if (status === "CONNECTING") {
    return (
      <Badge variant="secondary" className="text-xs">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse" />
        Connecting
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Disconnected
    </Badge>
  );
}

function TranscriptBubble({ item }: { item: TranscriptItem }) {
  const isUser = item.role === "user";
  const isInProgress = item.status === "IN_PROGRESS";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm leading-relaxed">
          {item.title}
          {isInProgress && (
            <span className="inline-block w-1 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </p>
        <span
          className={`text-[10px] mt-1 block ${
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}
        >
          {item.timestamp}
        </span>
      </div>
    </div>
  );
}

function FeedbackCard({ feedback, index }: { feedback: FeedbackItem; index: number }) {
  const ratingColors: Record<string, string> = {
    strong: "text-green-600 bg-green-50 border-green-200",
    adequate: "text-yellow-600 bg-yellow-50 border-yellow-200",
    needs_improvement: "text-red-600 bg-red-50 border-red-200",
  };
  const colors = ratingColors[feedback.rating] || ratingColors.adequate;

  return (
    <Card className={`border ${colors.split(" ").slice(1).join(" ")}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Q{index + 1} Feedback</span>
          <Badge variant="outline" className={`text-[10px] capitalize ${colors.split(" ")[0]}`}>
            {feedback.rating.replace("_", " ")}
          </Badge>
        </div>
        {feedback.strengths && (
          <div>
            <span className="text-[10px] font-medium text-green-700">Strengths</span>
            <p className="text-xs text-muted-foreground">{feedback.strengths}</p>
          </div>
        )}
        {feedback.improvements && (
          <div>
            <span className="text-[10px] font-medium text-amber-700">Improve</span>
            <p className="text-xs text-muted-foreground">{feedback.improvements}</p>
          </div>
        )}
        {feedback.tip && (
          <div className="flex items-start gap-1.5 pt-1 border-t">
            <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{feedback.tip}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewScreen({
  feedbackItems,
  transcriptItems,
  setupData,
  onRestart,
}: {
  feedbackItems: FeedbackItem[];
  transcriptItems: TranscriptItem[];
  setupData: InterviewSetupData | null;
  onRestart: () => void;
}) {
  const visibleMessages = transcriptItems.filter((i) => !i.isHidden && i.type === "MESSAGE");
  const strongCount = feedbackItems.filter((f) => f.rating === "strong").length;
  const totalQuestions = feedbackItems.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Interview Complete</h1>
            <p className="text-muted-foreground mt-1">
              {setupData?.companyName && `${setupData.companyName} — `}
              {setupData?.roleTitle || "General Interview"}
            </p>
          </div>
          <Button onClick={onRestart} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </div>

        {totalQuestions > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold">{totalQuestions}</div>
                  <div className="text-sm text-muted-foreground">Questions Asked</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{strongCount}</div>
                  <div className="text-sm text-muted-foreground">Strong Answers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {totalQuestions > 0 ? Math.round((strongCount / totalQuestions) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
              {visibleMessages.map((item) => (
                <div
                  key={item.itemId}
                  className={`p-3 rounded-lg text-sm ${
                    item.role === "assistant" ? "bg-muted" : "bg-primary/5 border border-primary/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.role === "assistant" ? (
                      <Bot className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs font-medium">
                      {item.role === "assistant" ? "Interviewer" : "You"}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{item.title}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feedback</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
              {feedbackItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No structured feedback was provided during this session.
                </p>
              ) : (
                feedbackItems.map((fb, i) => <FeedbackCard key={i} feedback={fb} index={i} />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LiveInterviewPage() {
  return (
    <EventProvider>
      <TranscriptProvider>
        <LiveSession />
      </TranscriptProvider>
    </EventProvider>
  );
}
