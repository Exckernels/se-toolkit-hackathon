"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

import { apiRequest } from "@/app/lib/api"

import { ChatPanel } from "./chat-panel"
import { IdeaForm } from "./idea-form"
import { IdeaSelector } from "./idea-selector"
import { ResultPanel } from "./result-panel"
import {
  type ChatMessage,
  tabs,
  type ApiIdeaVersion,
  type IdeaRecord,
  type StoredVersion,
  type Tab
} from "./types"
import { mapApiVersion } from "./utils"
import { VersionsSidebar } from "./versions-sidebar"

export function IdeaIncubatorClient() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("Overview")
  const [currentIdeaId, setCurrentIdeaId] = useState<number | null>(null)
  const [currentVersion, setCurrentVersion] = useState<StoredVersion | null>(null)
  const [versions, setVersions] = useState<StoredVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [error, setError] = useState("")
  const [chatError, setChatError] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [refinementMessage, setRefinementMessage] = useState("")
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [exportState, setExportState] = useState<"idle" | "copied" | "downloaded">("idle")

  const handleInputChange = (
    setter: Dispatch<SetStateAction<string>>,
    value: string
  ) => {
    setter(value)
    if (formError) {
      setFormError("")
    }
    if (error) {
      setError("")
    }
    if (chatError) {
      setChatError("")
    }
  }

  const loadIdeas = async () => {
    const loadedIdeas = await apiRequest<IdeaRecord[]>("/ideas")
    setIdeas(loadedIdeas)
    return loadedIdeas
  }

  const loadIdea = async (ideaId: number) => {
    return apiRequest<IdeaRecord>(`/ideas/${ideaId}`)
  }

  const loadVersions = async (ideaId: number) => {
    const data = await apiRequest<ApiIdeaVersion[]>(`/ideas/${ideaId}/versions`)
    return Array.isArray(data)
      ? data.map((version) => mapApiVersion(version))
      : []
  }

  const loadMessages = async (ideaId: number) => {
    const data = await apiRequest<ChatMessage[]>(`/ideas/${ideaId}/messages`)
    return Array.isArray(data) ? data : []
  }

  const selectIdea = async (idea: IdeaRecord) => {
    try {
      setIsLoading(true)
      setError("")
      setFormError("")
      setChatError("")
      setCopyState("idle")
      setExportState("idle")
      setRefinementMessage("")

      const loadedIdea = await loadIdea(idea.id)
      const loadedVersions = await loadVersions(idea.id)
      const loadedMessages = await loadMessages(idea.id)

      setCurrentIdeaId(loadedIdea.id)
      setTitle(loadedIdea.title)
      setDescription(loadedIdea.raw_description)
      setVersions(loadedVersions)
      setCurrentVersion(loadedVersions[0] ?? null)
      setMessages(loadedMessages)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while loading the idea."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const resetForNewIdea = () => {
    setCurrentIdeaId(null)
    setCurrentVersion(null)
    setVersions([])
    setTitle("")
    setDescription("")
    setFormError("")
    setError("")
    setChatError("")
    setMessages([])
    setRefinementMessage("")
    setCopyState("idle")
    setExportState("idle")
  }

  useEffect(() => {
    let ignore = false

    const bootstrap = async () => {
      try {
        setIsLoading(true)
        setError("")

        const loadedIdeas = await apiRequest<IdeaRecord[]>("/ideas")
        if (ignore) {
          return
        }

        setIdeas(loadedIdeas)

        if (loadedIdeas.length > 0) {
          const newestIdea = await loadIdea(loadedIdeas[0].id)
          setCurrentIdeaId(newestIdea.id)
          setTitle(newestIdea.title)
          setDescription(newestIdea.raw_description)

          const loadedVersions = await loadVersions(newestIdea.id)
          const loadedMessages = await loadMessages(newestIdea.id)
          if (ignore) {
            return
          }

          setVersions(loadedVersions)
          setCurrentVersion(loadedVersions[0] ?? null)
          setMessages(loadedMessages)
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load saved ideas."
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      ignore = true
    }
  }, [])

  const requestGeneration = async () => {
    if (isLoading) {
      return
    }

    if (!title.trim() && !description.trim()) {
      setFormError("")
      setError("Please enter an idea title or description.")
      return
    }

    setFormError("")
    setError("")
    setChatError("")
    setCopyState("idle")
    setExportState("idle")

    try {
      setIsLoading(true)

      let activeIdea: IdeaRecord | null = null

      if (!currentIdeaId) {
        activeIdea = await apiRequest<IdeaRecord>("/ideas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim() || "Untitled idea",
            raw_description: description.trim() || "",
          }),
        })

        const loadedIdeas = await loadIdeas()
        const matchingIdea =
          loadedIdeas.find((idea) => idea.id === activeIdea?.id) ?? activeIdea

        setCurrentIdeaId(matchingIdea.id)
        setTitle(matchingIdea.title)
        setDescription(matchingIdea.raw_description)
        activeIdea = matchingIdea
      } else {
        activeIdea =
          ideas.find((idea) => idea.id === currentIdeaId) ?? {
            id: currentIdeaId,
            title,
            raw_description: description,
          }
      }

      const createdVersion = await apiRequest<ApiIdeaVersion>(
        `/ideas/${activeIdea.id}/generate`,
        {
          method: "POST",
        }
      )

      const loadedVersions = await loadVersions(activeIdea.id)
      const loadedMessages = await loadMessages(activeIdea.id)

      setVersions(loadedVersions)
      setCurrentVersion(
        loadedVersions.find((version) => version.id === createdVersion.id) ??
          mapApiVersion(createdVersion)
      )
      setMessages(loadedMessages)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while generating the idea."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFreshIdea = () => {
    resetForNewIdea()
  }

  const handleGenerateClick = async () => {
    await requestGeneration()
  }

  const handleRefine = async () => {
    await requestGeneration()
  }

  const handleRefinementChange = (value: string) => {
    setRefinementMessage(value)
    if (chatError) {
      setChatError("")
    }
    if (error) {
      setError("")
    }
  }

  const submitRefinement = async (message: string) => {
    if (isLoading || !currentIdeaId) {
      return
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setChatError("Enter a refinement instruction first.")
      return
    }

    try {
      setIsLoading(true)
      setChatError("")
      setError("")
      setCopyState("idle")
      setExportState("idle")

      const createdVersion = await apiRequest<ApiIdeaVersion>(`/ideas/${currentIdeaId}/refine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedMessage }),
      })

      const [loadedVersions, loadedMessages] = await Promise.all([
        loadVersions(currentIdeaId),
        loadMessages(currentIdeaId),
      ])

      setVersions(loadedVersions)
      setCurrentVersion(
        loadedVersions.find((version) => version.id === createdVersion.id) ??
          mapApiVersion(createdVersion)
      )
      setMessages(loadedMessages)
      setRefinementMessage("")
    } catch (requestError) {
      setChatError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while refining the idea."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyOverview = async () => {
    if (!currentVersion?.overview) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentVersion.overview)
      setCopyState("copied")
      window.setTimeout(() => {
        setCopyState("idle")
      }, 2000)
    } catch {
      setError("Copy failed.")
    }
  }

  const buildPlanText = () => {
    if (!currentVersion) {
      return ""
    }

    const lines = [
      "Idea Incubator Plan",
      `Overview: ${currentVersion.overview ?? "No data generated."}`,
      `Audience: ${currentVersion.audience ?? "No data generated."}`,
      `Problem: ${currentVersion.problem ?? "No data generated."}`,
      `Solution: ${currentVersion.solution ?? "No data generated."}`,
      `MVP Scope: ${currentVersion.mvp_scope ?? "No data generated."}`,
      "",
      "Features:",
      ...(currentVersion.features?.length
        ? currentVersion.features.map(
            (feature) => `- ${feature.name || "Untitled feature"}: ${feature.description || "No data generated."}`
          )
        : ["- No data generated."]),
      "",
      "Risks:",
      ...(currentVersion.risks?.length
        ? currentVersion.risks.map(
            (risk) => `- ${risk.type || "Unspecified risk"}: ${risk.description || "No data generated."}`
          )
        : ["- No data generated."]),
      "",
      "Roadmap:",
      ...(currentVersion.roadmap?.length
        ? currentVersion.roadmap.map(
            (item) => `- Week ${item.week ?? "?"}: ${item.goal || "No data generated."}`
          )
        : ["- No data generated."]),
    ]

    return lines.join("\n")
  }

  const triggerDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    setExportState("downloaded")
    window.setTimeout(() => setExportState("idle"), 2000)
  }

  const handleCopyFullPlan = async () => {
    const content = buildPlanText()
    if (!content) {
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      setExportState("copied")
      window.setTimeout(() => setExportState("idle"), 2000)
    } catch {
      setError("Copy failed.")
    }
  }

  const handleDownloadText = () => {
    const content = buildPlanText()
    if (!content) {
      return
    }

    triggerDownload(content, `idea-version-${currentVersion?.id ?? "current"}.txt`, "text/plain")
  }

  const handleDownloadJson = () => {
    if (!currentVersion) {
      return
    }

    triggerDownload(
      JSON.stringify(currentVersion, null, 2),
      `idea-version-${currentVersion.id}.json`,
      "application/json"
    )
  }

  const deleteVersion = async (id: number) => {
    try {
      await apiRequest<{ id: number; message: string }>(`/versions/${id}`, {
        method: "DELETE",
      })

      if (!currentIdeaId) {
        setVersions([])
        setCurrentVersion(null)
        return
      }

      const loadedVersions = await loadVersions(currentIdeaId)
      setVersions(loadedVersions)
      setCurrentVersion(loadedVersions[0] ?? null)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while deleting the version."
      )
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-4xl font-bold">Idea Incubator</h1>
        <p className="mb-8 text-zinc-400">
          Transform raw ideas into structured MVP plans.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Create Idea</h2>

            <IdeaSelector
              currentIdeaId={currentIdeaId}
              ideas={ideas}
              isLoading={isLoading}
              onNewIdea={handleCreateFreshIdea}
              onSelectIdea={(idea) => {
                void selectIdea(idea)
              }}
            />

            <IdeaForm
              title={title}
              description={description}
              isLoading={isLoading}
              hasVersion={Boolean(currentVersion)}
              formError={formError}
              error={error}
              onTitleChange={(value) => handleInputChange(setTitle, value)}
              onDescriptionChange={(value) => handleInputChange(setDescription, value)}
              onGenerate={handleGenerateClick}
              onRefine={handleRefine}
            />

            <ResultPanel
              activeTab={activeTab}
              copyState={copyState}
              exportState={exportState}
              currentVersion={currentVersion}
              tabs={tabs}
              onCopyFullPlan={handleCopyFullPlan}
              onCopyOverview={handleCopyOverview}
              onDownloadJson={handleDownloadJson}
              onDownloadText={handleDownloadText}
              onTabChange={setActiveTab}
            />

            <ChatPanel
              error={chatError}
              isLoading={isLoading}
              messages={messages}
              refinementMessage={refinementMessage}
              onQuickAction={(message) => {
                void submitRefinement(message)
              }}
              onRefinementChange={handleRefinementChange}
              onSend={() => {
                void submitRefinement(refinementMessage)
              }}
            />
          </section>

          <VersionsSidebar
            currentVersion={currentVersion}
            versions={versions}
            onDelete={deleteVersion}
            onSelect={setCurrentVersion}
          />
        </div>
      </div>
    </main>
  )
}
