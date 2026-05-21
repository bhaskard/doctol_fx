import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { agentQueue } from "@/lib/queue";
import { enqueueAgentJob } from "@/lib/queue";
import { z } from "zod";
import crypto from "crypto";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(1).max(5000),
  cronExpr: z.string().regex(/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/),
  timezone: z.string().default("UTC"),
});

function signJob(userId: string, prompt: string): string {
  return crypto
    .createHmac("sha256", process.env.JOB_HMAC_SECRET!)
    .update(JSON.stringify({ userId, prompt }))
    .digest("hex");
}

export const GET = withAuth(async (_req, { userId }) => {
  const tasks = await db.scheduledTask.findMany({
    where: { userId },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(tasks);
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, prompt, cronExpr, timezone } = parsed.data;

  const task = await db.scheduledTask.create({
    data: { userId, name, prompt, cronExpr, timezone },
  });

  // Add jitter 0-300s to prevent thundering herd
  const jitterMs = Math.floor(Math.random() * 300_000);

  await (agentQueue as any).add(
    "run",
    {
      userId,
      prompt,
      taskType: "scheduled",
      jobHmac: signJob(userId, prompt),
    },
    {
      repeat: {
        pattern: cronExpr,
        tz: timezone,
        startDate: new Date(Date.now() + jitterMs),
      },
      jobId: `scheduled-${task.id}`,
    }
  );

  return NextResponse.json(task, { status: 201 });
});

export const PATCH = withAuth(async (req, { userId }) => {
  const { id, enabled } = await req.json();
  const task = await db.scheduledTask.findFirst({ where: { id, userId } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.scheduledTask.update({
    where: { id },
    data: { enabled },
  });
  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (req, { userId }) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const task = await db.scheduledTask.findFirst({ where: { id, userId } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove BullMQ repeatable job
  await (agentQueue as any).removeRepeatable("run", { pattern: task.cronExpr, tz: task.timezone }, `scheduled-${id}`);

  await db.scheduledTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
