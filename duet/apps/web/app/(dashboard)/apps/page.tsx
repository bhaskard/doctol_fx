import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const apps = await db.hostedApp.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const domain = process.env.HOSTED_APPS_DOMAIN ?? "localhost:3001";

  return (
    <div className="px-6 py-6 max-w-3xl">
      <h1 className="font-semibold text-gray-900 text-xl">Hosted Apps</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Apps your agent built and deployed. Ask in chat: &quot;Build me a dashboard showing X.&quot;
      </p>

      {apps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">No apps yet</p>
          <p className="text-sm mt-1">
            Go to Chat and ask: &quot;Build me a simple app that shows today&apos;s date and weather&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl"
            >
              <div>
                <p className="font-medium text-sm text-gray-900">{app.slug}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <a
                href={`http://${domain}/${app.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Open ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
