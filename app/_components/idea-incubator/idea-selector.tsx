import type { IdeaRecord } from "./types"

type IdeaSelectorProps = {
  currentIdeaId: number | null
  ideas: IdeaRecord[]
  isLoading: boolean
  onDeleteIdea: () => void
  onNewIdea: () => void
  onSelectIdea: (idea: IdeaRecord) => void
}

export function IdeaSelector({
  currentIdeaId,
  ideas,
  isLoading,
  onDeleteIdea,
  onNewIdea,
  onSelectIdea
}: IdeaSelectorProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">Ideas</p>
          <p className="text-sm text-zinc-400">
            Select an existing idea or start a new one.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDeleteIdea}
            disabled={isLoading || !currentIdeaId}
            className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300 transition-colors hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Delete Idea
          </button>
          <button
            type="button"
            onClick={onNewIdea}
            disabled={isLoading}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-100 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            New Idea
          </button>
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          No saved ideas yet. Generate your first one to create a persistent idea.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ideas.map((idea) => (
            <button
              key={idea.id}
              type="button"
              onClick={() => onSelectIdea(idea)}
              disabled={isLoading}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                currentIdeaId === idea.id
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <span className="block font-medium">{idea.title || "Untitled idea"}</span>
              <span className="mt-1 block text-xs opacity-70">
                {currentIdeaId === idea.id ? "Selected idea" : "Saved idea"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
