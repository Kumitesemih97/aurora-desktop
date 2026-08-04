export interface MCPServerConfig {
  type: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
}

export interface AppConfig {
  language: string;
  systemPrompt: string;
  mcpServers: Record<string, MCPServerConfig>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}