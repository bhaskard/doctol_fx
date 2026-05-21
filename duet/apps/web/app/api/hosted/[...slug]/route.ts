import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const appSlug = slug[0];

  if (!appSlug || !/^[a-z0-9-]{3,64}$/.test(appSlug)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const app = await db.hostedApp.findUnique({ where: { slug: appSlug } });
  if (!app) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(app.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "default-src 'self' https:; script-src 'none'; object-src 'none';",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
