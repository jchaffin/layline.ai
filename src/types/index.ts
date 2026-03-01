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
