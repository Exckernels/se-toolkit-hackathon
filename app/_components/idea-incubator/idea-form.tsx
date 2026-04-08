type IdeaFormProps = {
  title: string
  description: string
  isLoading: boolean
  hasVersion: boolean
  formError: string
  error: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onGenerate: () => void
  onRefine: () => void
}

export function IdeaForm({
  title,
  description,
  isLoading,
  hasVersion,
  formError,
  error,
  onTitleChange,
  onDescriptionChange,
  onGenerate,
  onRefine
}: IdeaFormProps) {
  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Idea title"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe your raw idea..."
        rows={6}
        className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>

        {hasVersion && (
          <button
            onClick={onRefine}
            disabled={isLoading}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Generating..." : "Refine"}
          </button>
        )}
      </div>

      {formError && <p className="text-sm text-rose-400">{formError}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  )
}
