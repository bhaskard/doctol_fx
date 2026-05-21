import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { enqueueAgentJob } from "@/lib/queue";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(10000),
  taskType: z.enum(["chat", "scheduled"]).default("chat"),
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const bullJobId = await enqueueAgentJob({
    userId,
    prompt: parsed.data.prompt,
    taskType: parsed.data.taskType,
  });

  // Create DB job record
  const agentJob = await db.agentJob.create({
    data: { userId, bullJobId, status: "queued" },
  });

  return NextResponse.json({ jobId: agentJob.id, bullJobId });
});
