import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/chat");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Your AI Coworker
        </h1>
        <p className="text-xl text-gray-500">
          An always-on AI agent that drafts replies in your voice, runs
          research, connects to your tools, and builds apps — all from one
          workspace.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/api/auth/signin"
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="border border-gray-200 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            See pricing
          </Link>
        </div>
        <p className="text-sm text-gray-400">$20 in free credits · No credit card required</p>
      </div>
    </main>
  );
}
