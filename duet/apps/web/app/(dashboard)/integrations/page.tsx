import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const SUPPORTED_INTEGRATIONS = [
  { id: "gmail", label: "Gmail", description: "Read and draft emails" },
  { id: "slack", label: "Slack", description: "Post messages and read channels" },
  { id: "notion", label: "Notion", description: "Read and write pages" },
  { id: "hubspot", label: "HubSpot", description: "CRM contacts and deals" },
  { id: "google_calendar", label: "Google Calendar", description: "Manage events" },
  { id: "linear", label: "Linear", description: "Issues and projects" },
  { id: "github", label: "GitHub", description: "Issues and pull requests" },
  { id: "zoom", label: "Zoom", description: "Meeting management" },
];

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const connected = await db.integration.findMany({
    where: { userId: session.user.id, status: "active" },
  });
  const connectedIds = new Set(connected.map((i) => i.provider));

  return (
    <div className="px-6 py-6 max-w-3xl">
      <h1 className="font-semibold text-gray-900 text-xl">Integrations</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Connect your tools so your agent can take action on your behalf.
      </p>

      {params.connected && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ {params.connected} connected successfully.
        </div>
      )}
      {params.error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid gap-3">
        {SUPPORTED_INTEGRATIONS.map((integration) => {
          const isConnected = connectedIds.has(integration.id);
          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl"
            >
              <div>
                <p className="font-medium text-sm text-gray-900">{integration.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{integration.description}</p>
              </div>
              {isConnected ? (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <a
                  href={`/api/composio/connect/${integration.id}`}
                  className="text-xs font-medium bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                >
                  Connect
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
