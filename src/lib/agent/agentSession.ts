export type AgentSessionState =
  | "idle"
  | "planning"
  | "running"
  | "reviewing"
  | "done"
  | "error";

export interface AgentSessionMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AgentSession {
  id: string;
  state: AgentSessionState;
  prompt: string;
  startedAt: string;
  updatedAt: string;
  activeFile?: string;
  messages: AgentSessionMessage[];
  metadata?: Record<string, string>;
}

const STORAGE_KEY = "cursor_ai_active_agent_session";

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createAgentSession(prompt: string, activeFile?: string): AgentSession {
  const time = new Date().toISOString();

  return {
    id: createId("session"),
    state: "planning",
    prompt,
    startedAt: time,
    updatedAt: time,
    activeFile,
    messages: [],
    metadata: {},
  };
}

export function updateAgentSession(
  session: AgentSession,
  patch: Partial<Pick<AgentSession, "state" | "activeFile" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function appendAgentSessionMessage(
  session: AgentSession,
  role: AgentSessionMessage["role"],
  content: string
): AgentSession {
  const message: AgentSessionMessage = {
    id: createId("msg"),
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  return updateAgentSession(session, {
    messages: [...session.messages, message],
  });
}

export function setAgentSessionState(
  session: AgentSession,
  state: AgentSessionState
): AgentSession {
  return updateAgentSession(session, { state });
}

export function saveAgentSession(session: AgentSession): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function loadAgentSession(): AgentSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentSession) : null;
  } catch {
    return null;
  }
}

export function clearAgentSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function addSessionMetadata(
  session: AgentSession,
  key: string,
  value: string
): AgentSession {
  return updateAgentSession(session, {
    metadata: {
      ...(session.metadata ?? {}),
      [key]: value,
    },
  });
}

export function getLastAssistantMessage(session: AgentSession): AgentSessionMessage | null {
  return [...session.messages].reverse().find((message) => message.role === "assistant") ?? null;
}
