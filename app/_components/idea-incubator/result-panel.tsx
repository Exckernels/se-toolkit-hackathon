import type { StoredVersion, Tab } from "./types"
import { FALLBACK_TEXT, renderTabText } from "./utils"

type ResultPanelProps = {
  activeTab: Tab
  copyState: "idle" | "copied"
  currentVersion: StoredVersion | null
  tabs: readonly Tab[]
  onCopyOverview: () => void
  onTabChange: (tab: Tab) => void
}

export function ResultPanel({
  activeTab,
  copyState,
  currentVersion,
  tabs,
  onCopyOverview,
  onTabChange
}: ResultPanelProps) {
  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              activeTab === tab
                ? "border-white bg-white text-black"
                : "border-zinc-700 text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {currentVersion ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">Latest generated version</p>
            <div className="flex items-center gap-3">
              <button
                onClick={onCopyOverview}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500"
              >
                {copyState === "copied" ? "Copied" : "Copy Overview"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            {(activeTab === "Overview" ||
              activeTab === "Audience" ||
              activeTab === "Problem" ||
              activeTab === "Solution" ||
              activeTab === "MVP Scope") && <p>{renderTabText(currentVersion, activeTab)}</p>}

            {activeTab === "Features" &&
              (currentVersion.features && currentVersion.features.length > 0 ? (
                <ul className="space-y-3">
                  {currentVersion.features.map((feature, index) => (
                    <li
                      key={index}
                      className="border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="font-medium">{feature.name || "Untitled feature"}</p>
                      <p className="text-zinc-400">
                        {feature.description || FALLBACK_TEXT}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">{FALLBACK_TEXT}</p>
              ))}

            {activeTab === "Risks" &&
              (currentVersion.risks && currentVersion.risks.length > 0 ? (
                <ul className="space-y-3">
                  {currentVersion.risks.map((risk, index) => (
                    <li
                      key={index}
                      className="border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="font-medium">{risk.type || "Unspecified risk"}</p>
                      <p className="text-zinc-400">{risk.description || FALLBACK_TEXT}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">{FALLBACK_TEXT}</p>
              ))}

            {activeTab === "Roadmap" &&
              (currentVersion.roadmap && currentVersion.roadmap.length > 0 ? (
                <ul className="space-y-3">
                  {currentVersion.roadmap.map((item, index) => (
                    <li
                      key={index}
                      className="border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="font-medium">Week {item.week ?? "?"}</p>
                      <p className="text-zinc-400">{item.goal || FALLBACK_TEXT}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">{FALLBACK_TEXT}</p>
              ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
          Generate an idea to see the structured MVP plan.
        </div>
      )}
    </div>
  )
}
