import type { ApiIdeaVersion, IdeaVersion, StoredVersion, Tab } from "./types"

export const FALLBACK_TEXT = "No data generated."
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

export function normalizeIdeaVersion(data: IdeaVersion): IdeaVersion {
  return {
    overview: data.overview ?? FALLBACK_TEXT,
    audience: data.audience ?? FALLBACK_TEXT,
    problem: data.problem ?? FALLBACK_TEXT,
    solution: data.solution ?? FALLBACK_TEXT,
    features: Array.isArray(data.features) ? data.features : [],
    mvp_scope: data.mvp_scope ?? FALLBACK_TEXT,
    risks: Array.isArray(data.risks) ? data.risks : [],
    roadmap: Array.isArray(data.roadmap) ? data.roadmap : []
  }
}

export function mapApiVersion(version: ApiIdeaVersion): StoredVersion {
  const normalized = normalizeIdeaVersion({
    overview: version.overview,
    audience: version.audience,
    problem: version.problem,
    solution: version.solution,
    features: Array.isArray(version.features_json) ? version.features_json : [],
    mvp_scope: version.mvp_scope,
    risks: Array.isArray(version.risks_json) ? version.risks_json : [],
    roadmap: Array.isArray(version.roadmap_json) ? version.roadmap_json : []
  })

  return {
    ...normalized,
    id: version.id,
    createdAt: new Date(version.created_at).toLocaleString(),
  }
}

export function renderTabText(version: StoredVersion, tab: Tab): string {
  if (tab === "Overview") return version.overview ?? FALLBACK_TEXT
  if (tab === "Audience") return version.audience ?? FALLBACK_TEXT
  if (tab === "Problem") return version.problem ?? FALLBACK_TEXT
  if (tab === "Solution") return version.solution ?? FALLBACK_TEXT
  return version.mvp_scope ?? FALLBACK_TEXT
}
