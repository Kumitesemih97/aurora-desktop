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

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}
