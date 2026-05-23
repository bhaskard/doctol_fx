import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { enqueueAgentJob } from "@/lib/queue";
import { db } from "@/lib/db";

function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  // Reject stale requests (> 5 minutes old)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false;

  const baseString = `v0:${timestamp}:${rawBody}`;
  const expected =
    "v0=" +
    crypto
      .createHmac("sha256", process.env.SLACK_SIGNING_SECRET!)
      .update(baseString)
      .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Respond to Slack's URL verification challenge immediately — no auth needed
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // All other events require valid HMAC signature
  const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
  const signature = req.headers.get("x-slack-signature") ?? "";

  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = payload.event as Record<string, string> | undefined;
  if (event?.type !== "app_mention") {
    return NextResponse.json({ ok: true });
  }

  const slackUserId = event.user;
  const mapping = await db.slackUserMapping.findUnique({ where: { slackUserId } });
  if (!mapping) {
    // User hasn't linked their account yet
    return NextResponse.json({ ok: true });
  }

  const prompt = (event.text ?? "").replace(/<@[A-Z0-9]+>/g, "").trim();
  if (!prompt) return NextResponse.json({ ok: true });

  await enqueueAgentJob({
    userId: mapping.userId,
    prompt,
    taskType: "webhook_slack",
    channelReplyTo: event.channel,
  });

  return NextResponse.json({ ok: true });
}
