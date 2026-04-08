export type Feature = {
  name: string
  description: string
}

export type Risk = {
  type: string
  description: string
}

export type RoadmapItem = {
  week: number
  goal: string
}

export type IdeaVersion = {
  overview?: string
  audience?: string
  problem?: string
  solution?: string
  features?: Feature[]
  mvp_scope?: string
  risks?: Risk[]
  roadmap?: RoadmapItem[]
}

export type StoredVersion = IdeaVersion & {
  id: number
  createdAt: string
}

export type IdeaRecord = {
  id: number
  title: string
  raw_description: string
  created_at?: string
  updated_at?: string
}

export type ApiIdeaVersion = {
  id: number
  idea_id: number
  overview: string
  audience: string
  problem: string
  solution: string
  features_json: Feature[]
  mvp_scope: string
  risks_json: Risk[]
  roadmap_json: RoadmapItem[]
  created_at: string
}

export type ChatMessage = {
  id: number
  idea_id: number
  role: "user" | "assistant"
  content: string
  created_at: string
}

export const tabs = [
  "Overview",
  "Audience",
  "Problem",
  "Solution",
  "Features",
  "MVP Scope",
  "Risks",
  "Roadmap"
] as const

export type Tab = (typeof tabs)[number]
