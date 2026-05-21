import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { userId }) => {
  const integrations = await db.integration.findMany({
    where: { userId },
    select: { id: true, provider: true, status: true },
  });
  return NextResponse.json(integrations);
});

export const DELETE = withAuth(async (req, { userId }) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 });

  await db.integration.updateMany({
    where: { userId, provider },
    data: { status: "disconnected" },
  });
  return NextResponse.json({ ok: true });
});
