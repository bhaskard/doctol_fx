"use client";

import { useState } from "react";
import { Plus, Trash2, Power, Clock } from "lucide-react";
import type { ScheduledTask } from "@prisma/client";

type Props = { initialTasks: ScheduledTask[] };

const PRESET_SCHEDULES = [
  { label: "Every morning at 9 AM", cron: "0 9 * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every Monday at 8 AM", cron: "0 8 * * 1" },
  { label: "Every day at midnight", cron: "0 0 * * *" },
];

export function ScheduleManager({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", prompt: "", cronExpr: "0 9 * * *", timezone: "UTC" });
  const [saving, setSaving] = useState(false);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setTasks((t) => [created, ...t]);
      setForm({ name: "", prompt: "", cronExpr: "0 9 * * *", timezone: "UTC" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteTask(id: string) {
    await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
    setTasks((t) => t.filter((task) => task.id !== id));
  }

  async function toggleTask(id: string, enabled: boolean) {
    await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, enabled: !enabled } : task)));
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
      >
        <Plus size={14} /> New scheduled task
      </button>

      {showForm && (
        <form
          onSubmit={createTask}
          className="bg-white border border-gray-100 rounded-xl p-5 space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-gray-600">Task name</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Morning briefing"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">What should the agent do?</label>
            <textarea
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 resize-none"
              rows={3}
              placeholder="Summarize my unread emails and send me a briefing via Slack"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Schedule</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {PRESET_SCHEDULES.map((p) => (
                <button
                  key={p.cron}
                  type="button"
                  onClick={() => setForm({ ...form, cronExpr: p.cron })}
                  className={`text-xs px-3 py-2 rounded-lg border transition ${
                    form.cronExpr === p.cron
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Cron expression (e.g. 0 9 * * *)"
              value={form.cronExpr}
              onChange={(e) => setForm({ ...form, cronExpr: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            >
              {saving ? "Saving…" : "Create task"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No scheduled tasks</p>
          <p className="text-sm mt-1">Create a task to run your agent automatically.</p>
        </div>
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-start justify-between p-4 bg-white border rounded-xl transition ${
            task.enabled ? "border-gray-100" : "border-gray-100 opacity-50"
          }`}
        >
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-gray-900">{task.name}</p>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                {task.cronExpr}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">{task.prompt}</p>
            {task.lastRun && (
              <p className="text-xs text-gray-400 mt-1">
                Last run: {new Date(task.lastRun).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTask(task.id, task.enabled)}
              className={`p-1.5 rounded-lg transition ${
                task.enabled
                  ? "text-green-600 hover:bg-green-50"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
              title={task.enabled ? "Disable" : "Enable"}
            >
              <Power size={14} />
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
