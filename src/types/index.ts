export type SessionStatus =
  | "idle"
  | "loading"
  | "recording"
  | "processing"
  | "error"
  | "CONNECTED";

export interface GuardrailResultType {
  status: string;
  category: string;
  rationale?: string;
  testText?: string;
}

export interface LoggedEvent {
  id: string;
  direction: "client" | "server";
  eventName: string;
  eventData: Record<string, unknown>;
  timestamp: string;
  expanded: boolean;
}

export interface TranscriptItem {
  itemId: string;
  type: "MESSAGE" | "BREADCRUMB";
  role?: "user" | "assistant";
  title?: string;
  data?: Record<string, any>;
  expanded: boolean;
  timestamp: string;
  createdAtMs: number;
  status: "IN_PROGRESS" | "DONE";
  isHidden: boolean;
  guardrailResult?: GuardrailResultType;
}
