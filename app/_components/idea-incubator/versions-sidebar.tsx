import type { StoredVersion } from "./types"
import { FALLBACK_TEXT } from "./utils"

type VersionsSidebarProps = {
  currentVersion: StoredVersion | null
  versions: StoredVersion[]
  onDelete: (id: number) => void
  onSelect: (version: StoredVersion) => void
}

export function VersionsSidebar({
  currentVersion,
  versions,
  onDelete,
  onSelect
}: VersionsSidebarProps) {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Versions</h2>

      {versions.length === 0 ? (
        <p className="text-zinc-400">No versions yet. Generate an idea to start building history.</p>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div
              key={version.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(version)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(version)
                }
              }}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                currentVersion?.id === version.id
                  ? "border-white bg-zinc-900"
                  : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">Version {versions.length - index}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(version.id)
                  }}
                  className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
                >
                  Delete
                </button>
              </div>
              <p className="line-clamp-2 text-sm text-zinc-400">
                {version.overview ?? FALLBACK_TEXT}
              </p>
              <p className="mt-2 text-xs text-zinc-500">{version.createdAt}</p>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
