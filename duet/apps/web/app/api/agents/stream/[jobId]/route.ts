import { NextRequest } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export const GET = withAuth(async (req, { userId, params }) => {
  const jobId = params?.jobId;
  if (!jobId) return new Response("Missing jobId", { status: 400 });

  // Verify this job belongs to the requesting user
  const job = await db.agentJob.findFirst({ where: { id: jobId, userId } });
  if (!job) return new Response("Not found", { status: 404 });

  // If job already done, return result immediately
  if (job.status === "done" || job.status === "error") {
    const data = job.status === "done"
      ? `data: ${JSON.stringify({ text: job.result })}\ndata: [DONE]\n\n`
      : `data: ${JSON.stringify({ error: job.result })}\ndata: [DONE]\n\n`;
    return new Response(data, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  const encoder = new TextEncoder();
  const channel = `job:${job.bullJobId}:chunks`;

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = redis.duplicate();
      await subscriber.subscribe(channel);

      subscriber.on("message", (_, message) => {
        if (message === "__done__") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          subscriber.unsubscribe(channel).then(() => subscriber.quit());
        } else {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      });

      req.signal.addEventListener("abort", () => {
        subscriber.unsubscribe(channel).then(() => subscriber.quit());
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
