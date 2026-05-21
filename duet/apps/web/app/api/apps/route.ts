import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, { userId }) => {
  const apps = await db.hostedApp.findMany({
    where: { userId },
    select: { id: true, slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(apps);
});

export const DELETE = withAuth(async (req, { userId }) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const app = await db.hostedApp.findFirst({ where: { id, userId } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.hostedApp.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
