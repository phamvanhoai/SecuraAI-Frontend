export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  permissions: readonly string[];
};

export type Session = { user: SessionUser; expiresAt: string };

export interface SessionGateway {
  getSession(signal?: AbortSignal): Promise<Session | null>;
  refresh(signal?: AbortSignal): Promise<Session>;
  logout(signal?: AbortSignal): Promise<void>;
}

// The Next.js BFF owns browser-facing HttpOnly cookies and exchanges tokens with
// the backend. Client components must never receive either raw token.
