import { ChatMessage } from "../types";
import { ToolCall } from "../types";

const OLLAMA_HOST = "http://localhost:11434";
const DEFAULT_MODEL = "gemma4:31b-cloud";

interface OllamaResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: any[];
  };
}

export async function sendOllamaChat(
  systemPrompt: string,
  messages: ChatMessage[],
  tools: any[] = [],
  modelName: string = DEFAULT_MODEL
): Promise<{ role: string; content: string; tool_calls?: any[] }> {
  const payload = {
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
        tool_calls: m.tool_calls,
        tool_call_id: m.tool_call_id,
      })),
    ],
    tools: tools,
    stream: false,
  };

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as OllamaResponse;
    return data.message;
  } catch (err) {
    console.error("Ollama API Error:", err);
    return {
      role: "assistant",
      content: `Error communicating with local Ollama instance: ${err}`,
    };
  }
}
