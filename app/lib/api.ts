const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

type ApiErrorPayload = {
  detail?: unknown
  error?: string
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init)
  const data = (await res.json()) as T | ApiErrorPayload

  if (!res.ok) {
    const payload = data as ApiErrorPayload
    const detail = payload?.detail

    if (typeof detail === "string") {
      throw new Error(detail)
    }

    if (detail && typeof detail === "object" && "error" in detail) {
      throw new Error(String((detail as { error?: string }).error || "Request failed."))
    }

    throw new Error(payload?.error || "Request failed.")
  }

  return data as T
}
