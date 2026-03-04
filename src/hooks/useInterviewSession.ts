"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useTranscript,
  useRealtimeSession,
  useEvent,
  type VoiceStatus,
} from "@jchaffin/voicekit";
import { openai } from "@jchaffin/voicekit/openai";
import { createInterviewAgent } from "@/agents/interviewAgent";
import { createMeAgent } from "@/agents/meAgent";
import { useCoachSession } from "./useCoachSession";
import { useAuth } from "@/hooks/useAuth";
import type {
  InterviewSetupData,
  FeedbackItem,
  CoachSuggestion,
  CoachWarning,
} from "@/types/interview";

const adapter = openai();

export function useInterviewSession() {
  const { user, isAuthenticated } = useAuth();
  const [sessionStatus, setSessionStatus] =
    useState<VoiceStatus>("DISCONNECTED");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [coachSuggestions, setCoachSuggestions] = useState<CoachSuggestion[]>(
    []
  );
  const [coachWarnings, setCoachWarnings] = useState<CoachWarning[]>([]);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [endSummary, setEndSummary] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<InterviewSetupData | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const isConnected = sessionStatus === "CONNECTED";
  const isDisconnected = sessionStatus === "DISCONNECTED";

  const statusRef = useRef<VoiceStatus>("DISCONNECTED");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    statusRef.current = sessionStatus;
  }, [sessionStatus]);

  const { transcriptItems, clearTranscript, addTranscriptMessage } =
    useTranscript();
  const { loggedEvents } = useEvent();
  const { connect, disconnect, sendUserText, sendEvent, mute, interrupt } =
    useRealtimeSession({
      onConnectionChange: (s) => setSessionStatus(s),
    });

  const { startCoach, stopCoach, coachStatus, regenerate: regenerateCoach, setCodingProblemActive } =
    useCoachSession();

  const lastEventIdxRef = useRef(0);
  useEffect(() => {
    for (let i = lastEventIdxRef.current; i < loggedEvents.length; i++) {
      const ev = loggedEvents[i];
      if (
        ev.eventName === "input_audio_buffer.committed" &&
        ev.eventData?.item_id
      ) {
        addTranscriptMessage(
          String(ev.eventData.item_id),
          "user",
          "",
        );
      }
    }
    lastEventIdxRef.current = loggedEvents.length;
  }, [loggedEvents, addTranscriptMessage]);

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

  const fetchCompanyResearch = async (
    company?: string,
    role?: string,
    jobDescription?: string
  ): Promise<string | null> => {
    if (!company && !role) return null;
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jobDescription }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.research || null;
    } catch {
      return null;
    }
  };

  const getResumeStorageKey = useCallback((): string => {
    if (typeof window === "undefined") return "parsedResumeData";
    if (isAuthenticated && user?.id) return `user:${user.id}:parsedResumeData`;
    return "guest:parsedResumeData";
  }, [isAuthenticated, user?.id]);

  const loadResumeSummary = useCallback((): string | null => {
    try {
      const key = getResumeStorageKey();
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      const resume = JSON.parse(stored);
      const parts: string[] = [];
      if (resume.name) parts.push(`Name: ${resume.name}`);
      if (resume.summary) parts.push(`Summary: ${resume.summary}`);
      if (resume.experience?.length) {
        const exp = resume.experience
          .slice(0, 3)
          .map(
            (e: { company?: string; role?: string; description?: string }) =>
              `${e.role || ""} at ${e.company || ""}: ${(e.description || "").slice(0, 200)}`
          )
          .join("\n");
        parts.push(`Recent Experience:\n${exp}`);
      }
      if (resume.skills?.length) {
        parts.push(`Skills: ${resume.skills.slice(0, 20).join(", ")}`);
      }
      return parts.join("\n\n");
    } catch {
      return null;
    }
  }, [getResumeStorageKey]);

  const startInterview = useCallback(
    async (data: InterviewSetupData) => {
      if (statusRef.current !== "DISCONNECTED") return;
      const audioEl = audioElementRef.current;
      if (!audioEl) return;

      setSetupData(data);
      setInterviewEnded(false);
      setEndSummary(null);
      setFeedbackItems([]);
      setCoachSuggestions([]);
      setCoachWarnings([]);

      const resumeSummary = data.resumeSummary ?? loadResumeSummary();

      let companyResearch = data.companyResearch || null;
      if (!companyResearch) {
        setIsResearching(true);
        companyResearch = await fetchCompanyResearch(
          data.companyName,
          data.roleTitle,
          data.jobDescription
        );
        setIsResearching(false);
      }

      const agent = createInterviewAgent({
        mode: data.mode,
        companyName: data.companyName,
        roleTitle: data.roleTitle,
        jobDescription: data.jobDescription,
        resumeSummary: resumeSummary || undefined,
        companyResearch: companyResearch || undefined,
      });

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
          extraContext: {
            interview: {
              mode: data.mode,
              company: data.companyName,
              role: data.roleTitle,
            },
            ...(companyResearch && { companyResearch }),
            ...(resumeSummary && { resumeSummary }),
            ...(data.jobDescription && {
              jobDescription: data.jobDescription,
            }),
          },
          adapter,
        });

        setTimeout(() => sendEvent({ type: "response.create" }), 1000);

        startCoach({
          context: {
            mode: data.mode,
            companyName: data.companyName,
            roleTitle: data.roleTitle,
            jobDescription: data.jobDescription,
            resumeSummary: resumeSummary || undefined,
            companyResearch: companyResearch || undefined,
          },
          interviewAudioEl: audioEl,
        }).catch((err) => console.error("[coach] startCoach failed:", err));
      } catch (error) {
        console.error("Interview connection failed:", error);
        setSessionStatus("DISCONNECTED");
      }
    },
    [clearTranscript, connect, sendEvent, startCoach, loadResumeSummary]
  );

  const endInterview = useCallback(async () => {
    await stopCoach();
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
        sendEvent({ type: "response.create" });
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

  // Interview agent events
  useEffect(() => {
    const onEnd = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEndSummary(detail?.summary || null);
      endInterview();
    };

    const onFeedback = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setFeedbackItems((prev) => [
        ...prev,
        { ...detail, timestamp: Date.now() },
      ]);
    };

    window.addEventListener("interview:end", onEnd);
    window.addEventListener("interview:feedback", onFeedback);
    return () => {
      window.removeEventListener("interview:end", onEnd);
      window.removeEventListener("interview:feedback", onFeedback);
    };
  }, [endInterview]);

  // MeAgent / coach events
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
      setCoachWarnings((prev) => [
        { ...detail, timestamp: Date.now() },
        ...prev,
      ]);
    };

    window.addEventListener("coach:suggestion", onSuggestion);
    window.addEventListener("coach:warning", onWarning);
    return () => {
      window.removeEventListener("coach:suggestion", onSuggestion);
      window.removeEventListener("coach:warning", onWarning);
    };
  }, []);

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
    regenerateCoach,
    setCodingProblemActive,
  };
}
