import { ChatMessage } from "../types";

const OLLAMA_HOST = "http://localhost:11434";
const DEFAULT_MODEL = "gemma4:31b-cloud";

export async function sendOllamaChat(
  systemPrompt: string,
  messages: ChatMessage[],
  modelName: string = DEFAULT_MODEL
): Promise<string> {
  const payload = {
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
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

    const data = await res.json();
    return data.message?.content || "";
  } catch (err) {
    console.error("Ollama API Error:", err);
    return `Error communicating with local Ollama instance: ${err}`;
  }
}