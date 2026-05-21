import { db } from "./db";

export async function getMemoryAsText(userId: string): Promise<string> {
  const files = await db.agentMemory.findMany({ where: { userId } });
  if (files.length === 0) return "No prior memory.";
  return files
    .map((f) => `=== ${f.filename} ===\n${f.content}`)
    .join("\n\n");
}

export async function saveMemoryFiles(
  userId: string,
  files: Record<string, string>
): Promise<void> {
  await Promise.all(
    Object.entries(files).map(([filename, content]) =>
      db.agentMemory.upsert({
        where: { userId_filename: { userId, filename } },
        create: { userId, filename, content },
        update: { content },
      })
    )
  );
}

export function assertSafeUserId(userId: string): void {
  if (!/^[a-z0-9_-]{1,64}$/.test(userId)) {
    throw new Error(`Invalid userId format: ${userId}`);
  }
}
