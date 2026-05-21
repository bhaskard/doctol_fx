import { Queue } from "bullmq";
import { getBullMQConnection } from "./redis";
import crypto from "crypto";

export type AgentJobData = {
  userId: string;
  prompt: string;
  taskType: "chat" | "scheduled" | "webhook_slack" | "webhook_telegram" | "summarize" | "build_app";
  jobHmac: string;
  channelReplyTo?: string; // Slack channel ID or Telegram chat ID
};

// Lazy Queue — only instantiated on first call (not at module import time)
let _queue: Queue | undefined;
function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("agent-tasks", {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return _queue;
}

export const agentQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    const q = getQueue();
    const value = (q as any)[prop];
    return typeof value === "function" ? value.bind(q) : value;
  },
});

function signJob(userId: string, prompt: string): string {
  return crypto
    .createHmac("sha256", process.env.JOB_HMAC_SECRET!)
    .update(JSON.stringify({ userId, prompt }))
    .digest("hex");
}

export async function enqueueAgentJob(
  data: Omit<AgentJobData, "jobHmac">
): Promise<string> {
  const hmac = signJob(data.userId, data.prompt);
  const job = await agentQueue.add("run", { ...data, jobHmac: hmac });
  return job.id!;
}
