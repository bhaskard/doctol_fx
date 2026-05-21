import { NextRequest, NextResponse } from "next/server";
import { enqueueAgentJob } from "@/lib/queue";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await req.json();
  const chatId = String(update.message?.chat?.id ?? "");
  const text: string = update.message?.text ?? "";

  if (!chatId || !text) return NextResponse.json({ ok: true });

  const mapping = await db.telegramChatMapping.findUnique({ where: { chatId } });
  if (!mapping) return NextResponse.json({ ok: true });

  await enqueueAgentJob({
    userId: mapping.userId,
    prompt: text,
    taskType: "webhook_telegram",
    channelReplyTo: chatId,
  });

  return NextResponse.json({ ok: true });
}
