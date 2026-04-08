import type { ChatMessage } from "./types"

const quickActions = [
  "Simplify",
  "Focus on MVP",
  "Make more realistic",
  "Reduce scope"
]

type ChatPanelProps = {
  error: string
  isLoading: boolean
  messages: ChatMessage[]
  refinementMessage: string
  onQuickAction: (message: string) => void
  onRefinementChange: (value: string) => void
  onSend: () => void
}

export function ChatPanel({
  error,
  isLoading,
  messages,
  refinementMessage,
  onQuickAction,
  onRefinementChange,
  onSend
}: ChatPanelProps) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">AI Refinement Loop</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Tell the AI how to improve the current plan, then save a new version.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={isLoading}
            onClick={() => onQuickAction(action)}
            className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No refinement messages yet. Try asking the AI to simplify the plan or focus on the MVP.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl border px-4 py-3 ${
                message.role === "user"
                  ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-zinc-500">
                <span>{message.role === "user" ? "You" : "Assistant"}</span>
                <span>{new Date(message.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm leading-6">{message.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        <textarea
          value={refinementMessage}
          onChange={(e) => onRefinementChange(e.target.value)}
          rows={4}
          placeholder="Try: make it simpler, reduce scope, or target university students..."
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">Each refinement creates a new saved version.</p>
          <button
            type="button"
            onClick={onSend}
            disabled={isLoading || !refinementMessage.trim()}
            className="rounded-xl border border-white/30 bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Refining..." : "Send / Refine"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </section>
  )
}
