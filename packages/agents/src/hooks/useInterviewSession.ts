"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useTranscript,
  useRealtimeSession,
  type VoiceStatus,
} from "@jchaffin/voicekit";
import { openai } from "@jchaffin/voicekit/openai";
import { createInterviewAgent } from "../agents/interviewAgent";
import { useCoachSession, type UseCoachSessionConfig } from "./useCoachSession";
import type {
  InterviewSetupData,
  FeedbackItem,
  CoachSuggestion,
  CoachWarning,
} from "../types/interview";

const adapter = openai();

export interface StorageAdapter {
  getItem: (key: string) => any;
}

export interface UseInterviewSessionConfig extends UseCoachSessionConfig {
  storage?: StorageAdapter;
}

export function useInterviewSession(config?: UseInterviewSessionConfig) {
  const base = config?.apiBaseUrl || "";

  const [sessionStatus, setSessionStatus] =
    useState<VoiceStatus>("DISCONNECTED");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [coachSuggestions, setCoachSuggestions] = useState<CoachSuggestion[]>([]);
  const [coachWarnings, setCoachWarnings] = useState<CoachWarning[]>([]);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [endSummary, setEndSummary] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<InterviewSetupData | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const isConnected = sessionStatus === "CONNECTED";
  const isDisconnected = sessionStatus === "DISCONNECTED";

  const statusRef = useRef<VoiceStatus>("DISCONNECTED");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { statusRef.current = sessionStatus; }, [sessionStatus]);

  const isConnectedRef = () => statusRef.current === "CONNECTED";
  const isConnectingRef = () => statusRef.current === "CONNECTING";

  const { transcriptItems, clearTranscript } = useTranscript();
  const { status: vkStatus, connect, disconnect, sendUserText, sendEvent, mute, interrupt } =
    useRealtimeSession({
      onConnectionChange: (s) => setSessionStatus(s),
    });

  useEffect(() => {
    if (vkStatus && vkStatus !== sessionStatus) {
      setSessionStatus(vkStatus);
    }
  }, [vkStatus, sessionStatus]);

  const { startCoach, stopCoach, coachStatus } = useCoachSession(config);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.createElement("audio");
    el.autoplay = true;
    el.style.display = "none";
    el.volume = 1.0;
    document.body.appendChild(el);
    audioElementRef.current = el;
    return () => { try { el.pause(); el.srcObject = null; el.remove(); } catch {} };
  }, []);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${base}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.ephemeralKey || null;
    } catch { return null; }
  };

  const fetchCompanyResearch = async (
    company?: string,
    role?: string,
    jobDescription?: string,
  ): Promise<string | null> => {
    if (!company && !role) return null;
    try {
      const res = await fetch(`${base}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jobDescription }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.research || null;
    } catch { return null; }
  };

  const loadResumeSummary = (): string | null => {
    const storage = config?.storage;
    if (!storage) return null;
    try {
      const resume = storage.getItem("parsedResumeData");
      if (!resume) return null;
      const parts: string[] = [];
      if (resume.name) parts.push(`Name: ${resume.name}`);
      if (resume.summary) parts.push(`Summary: ${resume.summary}`);
      if (resume.experience?.length) {
        const exp = resume.experience
          .slice(0, 3)
          .map(
            (e: { company?: string; role?: string; description?: string }) =>
              `${e.role || ""} at ${e.company || ""}: ${(e.description || "").slice(0, 200)}`,
          )
          .join("\n");
        parts.push(`Recent Experience:\n${exp}`);
      }
      if (resume.skills?.length) {
        parts.push(`Skills: ${resume.skills.slice(0, 20).join(", ")}`);
      }
      return parts.join("\n\n");
    } catch { return null; }
  };

  const connectToRealtime = useCallback(
    async (agents: ReturnType<typeof createInterviewAgent>[], extraContext: Record<string, unknown>) => {
      if (isConnectedRef() || isConnectingRef()) return;
      const audioEl = audioElementRef.current;
      if (!audioEl) return;

      clearTranscript();

      const ephemeralKey = await fetchEphemeralKey();
      if (!ephemeralKey) return;

      audioEl.muted = false;
      audioEl.volume = 1.0;

      await connect({
        getEphemeralKey: () => Promise.resolve(ephemeralKey),
        initialAgents: agents,
        audioElement: audioEl,
        extraContext,
        adapter,
      });
    },
    [clearTranscript, connect],
  );

  const disconnectFromRealtime = useCallback(async () => {
    if (audioElementRef.current) {
      const src = audioElementRef.current.srcObject as MediaStream | null;
      audioElementRef.current.srcObject = null;
      if (src) src.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      try { audioElementRef.current.pause(); } catch {}
    }
    try { await disconnect(); } catch {}
  }, [disconnect]);

  const startInterview = useCallback(
    async (data: InterviewSetupData) => {
      setSetupData(data);
      setInterviewEnded(false);
      setEndSummary(null);
      setFeedbackItems([]);
      setCoachSuggestions([]);
      setCoachWarnings([]);
      setIsResearching(true);

      const resumeSummary = loadResumeSummary();
      const companyResearch = await fetchCompanyResearch(
        data.companyName,
        data.roleTitle,
        data.jobDescription,
      );
      setIsResearching(false);

      const agent = createInterviewAgent({
        mode: data.mode,
        companyName: data.companyName,
        roleTitle: data.roleTitle,
        jobDescription: data.jobDescription,
      });

      await connectToRealtime([agent], {
        interview: {
          mode: data.mode,
          company: data.companyName,
          role: data.roleTitle,
        },
        ...(companyResearch && { companyResearch }),
        ...(resumeSummary && { resumeSummary }),
        ...(data.jobDescription && { jobDescription: data.jobDescription }),
      });

      sendEvent({ type: "response.create" });

      startCoach({
        context: {
          mode: data.mode,
          companyName: data.companyName,
          roleTitle: data.roleTitle,
          jobDescription: data.jobDescription,
          resumeSummary: resumeSummary || undefined,
        },
        audioElement: audioElementRef.current,
      });
    },
    [connectToRealtime, sendEvent, startCoach],
  );

  const endInterview = useCallback(async () => {
    await stopCoach();
    await disconnectFromRealtime();
    setInterviewEnded(true);
  }, [disconnectFromRealtime, stopCoach]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!isConnectedRef()) return;
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
    [sendUserText, sendEvent, interrupt],
  );

  const toggleMute = useCallback(
    (muted: boolean) => { mute(muted); },
    [mute],
  );

  useEffect(() => {
    const onEnd = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEndSummary(detail?.summary || null);
      endInterview();
    };
    const onFeedback = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setFeedbackItems((prev) => [...prev, { ...detail, timestamp: Date.now() }]);
    };
    window.addEventListener("interview:end", onEnd);
    window.addEventListener("interview:feedback", onFeedback);
    return () => {
      window.removeEventListener("interview:end", onEnd);
      window.removeEventListener("interview:feedback", onFeedback);
    };
  }, [endInterview]);

  useEffect(() => {
    const onSuggestion = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const ts = detail.timestamp || Date.now();
      const streaming = detail.streaming ?? false;
      setCoachSuggestions((prev) => {
        const existing = prev.findIndex((s) => s.timestamp === ts);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { response: detail.response, timestamp: ts, streaming };
          return updated;
        }
        return [{ response: detail.response, timestamp: ts, streaming }, ...prev];
      });
    };
    const onWarning = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCoachWarnings((prev) => [{ ...detail, timestamp: Date.now() }, ...prev]);
    };
    window.addEventListener("coach:suggestion", onSuggestion);
    window.addEventListener("coach:warning", onWarning);
    return () => {
      window.removeEventListener("coach:suggestion", onSuggestion);
      window.removeEventListener("coach:warning", onWarning);
    };
  }, []);

  const disconnectRef = useRef(disconnect);
  useEffect(() => { disconnectRef.current = disconnect; }, [disconnect]);
  useEffect(() => {
    return () => { disconnectRef.current().catch(() => {}); };
  }, []);

  return {
    sessionStatus,
    isConnected,
    isDisconnected,
    isResearching,
    transcriptItems,
    feedbackItems,
    coachSuggestions,
    coachWarnings,
    interviewEnded,
    endSummary,
    setupData,
    startInterview,
    endInterview,
    sendMessage,
    toggleMute,
    coachStatus,
  };
}
