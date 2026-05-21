import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <h1 className="font-semibold text-gray-900">Agent Chat</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ask your AI coworker anything — it has access to your connected tools.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}
