import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextRequest, NextResponse } from "next/server";

export type AuthedContext = { userId: string; params?: Record<string, string> };
export type AuthedHandler = (req: NextRequest, ctx: AuthedContext) => Promise<NextResponse | Response>;

// Returns an async function compatible with Next.js 15 App Router route handlers.
// Usage: export const GET = withAuth(async (req, { userId, params }) => { ... })
export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await context.params;
    return handler(req, { userId: session.user.id, params });
  };
}
