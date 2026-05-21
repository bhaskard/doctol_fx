"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: prompt };
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      pending: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      // 1. Enqueue the job
      const runRes = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, taskType: "chat" }),
      });
      if (!runRes.ok) throw new Error("Failed to start agent");
      const { jobId } = await runRes.json();

      // 2. Stream the result via SSE
      const es = new EventSource(`/api/agents/stream/${jobId}`);
      let accumulated = "";

      es.onmessage = (event) => {
        if (event.data === "[DONE]") {
          es.close();
          setLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: accumulated, pending: false } : m
            )
          );
          return;
        }
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.error) {
            accumulated = `Error: ${parsed.error}`;
          } else if (parsed.text) {
            accumulated += parsed.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: accumulated } : m
              )
            );
          }
        } catch {
          // ignore malformed chunks
        }
      };

      es.onerror = () => {
        es.close();
        setLoading(false);
      };
    } catch (err) {
      setLoading(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Something went wrong. Please try again.", pending: false }
            : m
        )
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg font-medium">How can I help you today?</p>
            <p className="text-sm mt-1">
              Try: &quot;Summarize my last 5 emails&quot; or &quot;Draft a reply to Sarah&quot;
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-black text-white"
                  : "bg-white border border-gray-100 text-gray-900"
              }`}
            >
              {msg.content || (msg.pending && <Loader2 size={14} className="animate-spin" />)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your agent..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-40 transition flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
