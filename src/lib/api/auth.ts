import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((s) => {
      const i = s.indexOf("=");
      const name = i < 0 ? s.trim() : s.slice(0, i).trim();
      const value = i < 0 ? "" : decodeCookieValue(s.slice(i + 1).trim());
      return [name, value];
    })
  );
}

export async function getSession() {
  return getServerSession(authOptions);
}

/** Use when the caller has the raw request (e.g. API route) so cookies from non-browser clients (Electron) are used. */
export async function getSessionFromRequest(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);
  const headers = Object.fromEntries(request.headers.entries());
  const req = { cookies, headers };
  const res = { getHeader: () => undefined, setCookie: () => {}, setHeader: () => {} };
  return getServerSession(req as any, res as any, authOptions);
}

export async function getRequiredSession(request?: NextRequest) {
  const session = request
    ? await getSessionFromRequest(request)
    : await getSession();
  if (!session?.user) {
    throw new AuthError("Authentication required");
  }
  return session;
}

export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

export function unauthorizedResponse(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}
