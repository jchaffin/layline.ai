"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useTranscript,
  useRealtimeSession,
  type VoiceStatus,
} from "@jchaffin/voicekit";
import { openai } from "@jchaffin/voicekit/openai";
import { createInterviewAgent } from "@/agents/interview_agent";

const adapter = openai();

export interface InterviewSetupData {
  companyName?: string;
  roleTitle?: string;
  interviewType?: string;
  jobDescription?: string;
}

export interface FeedbackItem {
  rating: string;
  strengths: string;
  improvements: string;
  tip: string;
  timestamp: number;
}

export function useInterviewSession() {
  const [sessionStatus, setSessionStatus] =
    useState<VoiceStatus>("DISCONNECTED");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [setupData, setSetupData] = useState<InterviewSetupData | null>(null);

  const isConnected = sessionStatus === "CONNECTED";
  const isDisconnected = sessionStatus === "DISCONNECTED";

  const statusRef = useRef<VoiceStatus>("DISCONNECTED");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    statusRef.current = sessionStatus;
  }, [sessionStatus]);

  const { transcriptItems, clearTranscript } = useTranscript();
  const { connect, disconnect, sendUserText, sendEvent, mute, interrupt } =
    useRealtimeSession({
      onConnectionChange: (s) => setSessionStatus(s),
    });

  // Create hidden audio element for playback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.createElement("audio");
    el.autoplay = true;
    el.style.display = "none";
    el.volume = 1.0;
    document.body.appendChild(el);
    audioElementRef.current = el;
    return () => {
      try {
        el.pause();
        el.srcObject = null;
        el.remove();
      } catch {}
    };
  }, []);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.ephemeralKey || null;
    } catch {
      return null;
    }
  };

  const startInterview = useCallback(
    async (data: InterviewSetupData) => {
      if (statusRef.current !== "DISCONNECTED") return;
      const audioEl = audioElementRef.current;
      if (!audioEl) return;

      setSetupData(data);
      setInterviewEnded(false);
      setFeedbackItems([]);

      const agent = createInterviewAgent(data);

      try {
        setSessionStatus("CONNECTING");
        clearTranscript();

        const ephemeralKey = await fetchEphemeralKey();
        if (!ephemeralKey) {
          setSessionStatus("DISCONNECTED");
          return;
        }

        audioEl.muted = false;
        audioEl.volume = 1.0;

        await connect({
          getEphemeralKey: () => Promise.resolve(ephemeralKey),
          initialAgents: [agent],
          audioElement: audioEl,
          extraContext: { interview: data },
          adapter,
        });

        // Trigger the agent's opening greeting
        setTimeout(() => sendEvent({ type: "response.create" }), 1000);
      } catch (error) {
        console.error("Interview connection failed:", error);
        setSessionStatus("DISCONNECTED");
      }
    },
    [clearTranscript, connect, sendEvent]
  );

  const endInterview = useCallback(async () => {
    const src = audioElementRef.current?.srcObject as MediaStream | null;
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      if (src)
        src.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
      try {
        audioElementRef.current.pause();
      } catch {}
    }

    try {
      await disconnect();
    } catch {}
    setSessionStatus("DISCONNECTED");
    setInterviewEnded(true);
  }, [disconnect]);

  const sendMessage = useCallback(
    (text: string) => {
      if (statusRef.current !== "CONNECTED") return;
      interrupt();
      try {
        sendUserText(text);
      } catch {
        sendEvent({
          type: "conversation.item.create",
          item: {
            id: Math.random().toString(36).substring(2, 15),
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        });
        sendEvent({ type: "response.create" });
      }
    },
    [sendUserText, sendEvent, interrupt]
  );

  const toggleMute = useCallback(
    (muted: boolean) => {
      mute(muted);
    },
    [mute]
  );

  // Listen for interview events from agent tools
  useEffect(() => {
    const handleEnd = () => {
      endInterview();
    };

    const handleFeedback = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setFeedbackItems((prev) => [
        ...prev,
        { ...detail, timestamp: Date.now() },
      ]);
    };

    window.addEventListener("interview:end", handleEnd);
    window.addEventListener("interview:feedback", handleFeedback);
    return () => {
      window.removeEventListener("interview:end", handleEnd);
      window.removeEventListener("interview:feedback", handleFeedback);
    };
  }, [endInterview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusRef.current !== "DISCONNECTED") {
        disconnect().catch(() => {});
      }
    };
  }, [disconnect]);

  return {
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
  };
}
