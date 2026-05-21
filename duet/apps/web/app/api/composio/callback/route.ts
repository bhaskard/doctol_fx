import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { enqueueAgentJob } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=auth`);
  }

  const url = new URL(req.url);
  const connId = url.searchParams.get("connectedAccountId");
  const provider = url.searchParams.get("appName")?.toLowerCase() ?? "unknown";

  if (!connId) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=missing_conn_id`
    );
  }

  await db.integration.upsert({
    where: { userId_provider: { userId: session.user.id, provider } },
    create: { userId: session.user.id, provider, composioConnId: connId },
    update: { composioConnId: connId, status: "active" },
  });

  // Kick off tone-matching job for Gmail
  if (provider === "gmail") {
    await enqueueAgentJob({
      userId: session.user.id,
      prompt: `Fetch the user's last 20 sent emails from Gmail. Analyze the writing style: vocabulary, sentence length, formality level, common phrases, tone. Write a concise style guide and save it as a memory block:
\`\`\`memory
writing_style.md
<style guide content here>
\`\`\``,
      taskType: "summarize",
    });
  }

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/integrations?connected=${provider}`
  );
}
