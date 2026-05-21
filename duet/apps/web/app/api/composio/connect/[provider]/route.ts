import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { Composio } from "@composio/core";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId, params }) => {
  const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
  const provider = params?.provider;
  if (!provider || !/^[a-z_]+$/.test(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const connRequest = await composio.connectedAccounts.initiate(
    userId,
    provider,
    {
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/composio/callback`,
    }
  );

  const redirectUrl = (connRequest as { redirectUrl?: string; connectionStatus?: string })
    ?.redirectUrl ?? `${process.env.NEXTAUTH_URL}/integrations?error=no_redirect`;

  return NextResponse.redirect(redirectUrl);
});
