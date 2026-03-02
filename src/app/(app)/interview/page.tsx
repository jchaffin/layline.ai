"use client";

import { useState, useRef, useEffect } from "react";
import { TranscriptProvider, EventProvider } from "@jchaffin/voicekit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  Square,
  Send,
  Bot,
  User,
  Star,
  ArrowUp,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import {
  useInterviewSession,
  type InterviewSetupData,
  type FeedbackItem,
} from "@/hooks/use_interview_session";
import InterviewSetup from "@/components/interview/InterviewSetup";
import type { TranscriptItem } from "@jchaffin/voicekit";

function InterviewSession() {
  const {
    sessionStatus,
    isConnected,
    isDisconnected,
    transcriptItems,
    feedbackItems,
    interviewEnded,
    setupData,
    startInterview,
    endInterview,
    sendMessage,
    toggleMute,
  } = useInterviewSession();

  const [phase, setPhase] = useState<"setup" | "active" | "review">("setup");
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptItems]);

  useEffect(() => {
    if (interviewEnded && phase === "active") {
      setPhase("review");
    }
  }, [interviewEnded, phase]);

  const handleStart = async (data: InterviewSetupData) => {
    setPhase("active");
    await startInterview(data);
  };

  const handleEnd = () => {
    endInterview();
    setPhase("review");
  };

  const handleRestart = () => {
    setPhase("setup");
    setIsMuted(false);
    setTextInput("");
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

  if (phase === "setup") {
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

  if (phase === "review") {
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
    (item) => !item.isHidden && item.type === "MESSAGE"
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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

      {/* Main content */}
      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* Transcript */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {visibleItems.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  {sessionStatus === "CONNECTING" ? (
                    <p className="animate-pulse">Connecting to interviewer...</p>
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

          {/* Input area */}
          <div className="border-t px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={handleMuteToggle}
                disabled={!isConnected}
                title={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
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

        {/* Feedback sidebar */}
        {feedbackItems.length > 0 && (
          <div className="w-80 border-l overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Live Feedback
            </h3>
            {feedbackItems.map((fb, i) => (
              <FeedbackCard key={i} feedback={fb} index={i} />
            ))}
          </div>
        )}
      </div>
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
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
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

function FeedbackCard({
  feedback,
  index,
}: {
  feedback: FeedbackItem;
  index: number;
}) {
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
          <Badge
            variant="outline"
            className={`text-[10px] capitalize ${colors.split(" ")[0]}`}
          >
            {feedback.rating.replace("_", " ")}
          </Badge>
        </div>
        {feedback.strengths && (
          <div>
            <span className="text-[10px] font-medium text-green-700">
              Strengths
            </span>
            <p className="text-xs text-muted-foreground">{feedback.strengths}</p>
          </div>
        )}
        {feedback.improvements && (
          <div>
            <span className="text-[10px] font-medium text-amber-700">
              Improve
            </span>
            <p className="text-xs text-muted-foreground">
              {feedback.improvements}
            </p>
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
  const visibleMessages = transcriptItems.filter(
    (i) => !i.isHidden && i.type === "MESSAGE"
  );

  const strongCount = feedbackItems.filter(
    (f) => f.rating === "strong"
  ).length;
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

        {/* Summary */}
        {totalQuestions > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold">{totalQuestions}</div>
                  <div className="text-sm text-muted-foreground">
                    Questions Asked
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {strongCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Strong Answers
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {totalQuestions > 0
                      ? Math.round((strongCount / totalQuestions) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
              {visibleMessages.map((item) => (
                <div
                  key={item.itemId}
                  className={`p-3 rounded-lg text-sm ${
                    item.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary/5 border border-primary/10"
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

          {/* Feedback */}
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
                feedbackItems.map((fb, i) => (
                  <FeedbackCard key={i} feedback={fb} index={i} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <EventProvider>
      <TranscriptProvider>
        <InterviewSession />
      </TranscriptProvider>
    </EventProvider>
  );
}
