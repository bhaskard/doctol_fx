import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ScheduleManager } from "@/components/schedule/ScheduleManager";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const tasks = await db.scheduledTask.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "desc" },
  });

  return (
    <div className="px-6 py-6 max-w-3xl">
      <h1 className="font-semibold text-gray-900 text-xl">Scheduled Tasks</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Set up recurring tasks your agent runs automatically.
      </p>
      <ScheduleManager initialTasks={tasks} />
    </div>
  );
}
