export async function POST(req: Request) {
  try {
    const { idea } = await req.json()

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a product strategist.
Return ONLY raw valid JSON.
Do not use markdown.
Do not wrap in code fences.
Do not add explanations.
Return this exact structure:
{
  "overview": "...",
  "audience": "...",
  "problem": "...",
  "solution": "...",
  "features": [{"name": "...", "description": "..."}],
  "mvp_scope": "...",
  "risks": [{"type": "...", "description": "..."}],
  "roadmap": [{"week": 1, "goal": "..."}]
}`,
          },
          {
            role: "user",
            content: idea,
          },
        ],
      }),
    })

    const text = await response.text()

    if (!response.ok) {
      return Response.json(
        {
          error: "OpenRouter request failed",
          status: response.status,
          raw: text,
        },
        { status: 500 }
      )
    }

    let json: {
      choices?: Array<{
        message?: {
          content?: string
          }
      }>
    }
    try {
      json = JSON.parse(text)
    } catch {
      return Response.json(
        {
          error: "OpenRouter returned invalid JSON",
          raw: text,
        },
        { status: 500 }
      )
    }

    const content = json?.choices?.[0]?.message?.content

    if (!content) {
      return Response.json(
        {
          error: "No content returned from model",
          raw: json,
        },
        { status: 500 }
      )
    }

    const cleanedContent = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    try {
      const parsed = JSON.parse(cleanedContent) as Record<string, unknown>

      if (!parsed.overview || !parsed.audience || !parsed.problem || !parsed.solution) {
        return Response.json(
          {
            error: "Model returned incomplete JSON structure",
            raw: cleanedContent,
          },
          { status: 500 }
        )
      }

      return Response.json(parsed)
    } catch {
      const start = cleanedContent.indexOf("{")
      const end = cleanedContent.lastIndexOf("}")

      if (start !== -1 && end !== -1 && end > start) {
        const recoveredContent = cleanedContent.slice(start, end + 1)

        try {
          const parsed = JSON.parse(recoveredContent) as Record<string, unknown>

          if (!parsed.overview || !parsed.audience || !parsed.problem || !parsed.solution) {
            return Response.json(
              {
                error: "Model returned incomplete JSON structure",
                raw: recoveredContent,
              },
              { status: 500 }
            )
          }

          return Response.json(parsed)
        } catch {
          return Response.json(
            {
              error: "Model returned non-JSON content",
              raw: content,
            },
            { status: 500 }
          )
        }
      }

      return Response.json(
        {
          error: "Model returned non-JSON content",
          raw: content,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
