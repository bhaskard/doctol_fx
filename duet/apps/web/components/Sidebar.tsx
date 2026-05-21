"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plug, Clock, Layout, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/schedule", label: "Schedule", icon: Clock },
  { href: "/apps", label: "Apps", icon: Layout },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <span className="font-bold text-lg tracking-tight">Duet</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {user.image && (
            <img
              src={user.image}
              alt={user.name ?? ""}
              className="w-7 h-7 rounded-full flex-shrink-0"
            />
          )}
          <span className="text-sm text-gray-700 truncate">{user.name}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-gray-400 hover:text-gray-700 transition"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
