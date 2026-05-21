import { Worker } from "bullmq";
import { redis, getBullMQConnection } from "../../web/lib/redis";
import { db } from "../../web/lib/db";
import { runAgent } from "./agent-runner";
import type { AgentJobData } from "../../web/lib/queue";

async function postSlackReply(channelId: string, text: string) {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({ channel: channelId, text }),
  });
}

async function postTelegramMessage(chatId: string, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
}

const worker = new Worker<AgentJobData>(
  "agent-tasks",
  async (job) => {
    const { userId, prompt, taskType, jobHmac, channelReplyTo } = job.data;

    // Update job status in DB
    await db.agentJob.updateMany({
      where: { bullJobId: job.id },
      data: { status: "running" },
    });

    const result = await runAgent(
      userId,
      prompt,
      taskType,
      jobHmac,
      job.id!,
      (chunk) => {
        redis.publish(`job:${job.id}:chunks`, JSON.stringify({ text: chunk }));
      }
    );

    // Signal SSE stream complete
    await redis.publish(`job:${job.id}:chunks`, "__done__");

    // Reply to bot channels
    if (channelReplyTo) {
      if (taskType === "webhook_slack") {
        await postSlackReply(channelReplyTo, result);
      } else if (taskType === "webhook_telegram") {
        await postTelegramMessage(channelReplyTo, result);
      }
    }

    await db.agentJob.updateMany({
      where: { bullJobId: job.id },
      data: { status: "done", result },
    });
  },
  {
    connection: getBullMQConnection(),
    concurrency: 5, // max 5 concurrent Claude sessions per worker process
  }
);

worker.on("failed", async (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
  if (!job) return;

  await redis.publish(
    `job:${job.id}:chunks`,
    JSON.stringify({ error: err.message })
  );
  await redis.publish(`job:${job.id}:chunks`, "__done__");

  await db.agentJob.updateMany({
    where: { bullJobId: job.id },
    data: { status: "error", result: err.message },
  });

  // Release agent mutex on failure
  await db.agentSession.updateMany({
    where: { userId: job.data.userId, status: "running" },
    data: { status: "idle" },
  });
});

worker.on("ready", () => console.log("Worker ready — concurrency=5"));

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
