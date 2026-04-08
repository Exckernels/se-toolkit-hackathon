type ExportActionsProps = {
  isDisabled: boolean
  onCopyFullPlan: () => void
  onDownloadJson: () => void
  onDownloadText: () => void
}

export function ExportActions({
  isDisabled,
  onCopyFullPlan,
  onDownloadJson,
  onDownloadText
}: ExportActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onCopyFullPlan}
        disabled={isDisabled}
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Copy Full Plan
      </button>
      <button
        type="button"
        onClick={onDownloadText}
        disabled={isDisabled}
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Download .txt
      </button>
      <button
        type="button"
        onClick={onDownloadJson}
        disabled={isDisabled}
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Download .json
      </button>
    </div>
  )
}
