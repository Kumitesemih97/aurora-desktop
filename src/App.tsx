import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "./components/Sidebar";
import { ChatCanvas } from "./components/ChatCanvas";
import { SettingsView } from "./components/SettingsView";
import { ChatSession, ChatMessage, AppConfig } from "./types";
import { TRANSLATIONS, DEFAULT_SYSTEM_PROMPTS, detectOSLanguage } from "./translations";
import { sendOllamaChat } from "./services/ollama";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>(detectOSLanguage());

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem("aurora-config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
    return {
      language: detectOSLanguage(),
      systemPrompt: DEFAULT_SYSTEM_PROMPTS[detectOSLanguage()],
      mcpServers: {},
    };
  });

  React.useEffect(() => {
    localStorage.setItem("aurora-config", JSON.stringify(config));
  }, [config]);

  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "1", title: "New Chat", messages: [] },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("1");

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const newPrompt = DEFAULT_SYSTEM_PROMPTS[newLang] || DEFAULT_SYSTEM_PROMPTS["en"];
    setConfig((prev) => ({ ...prev, language: newLang, systemPrompt: newPrompt }));
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputPrompt,
    };

    const updatedMessages = [...activeSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const isNew = s.title === "New Chat" || s.title === t("new_chat_default_title");
          return {
            ...s,
            title: isNew ? inputPrompt.slice(0, 20) + "..." : s.title,
            messages: updatedMessages,
          };
        }
        return s;
      })
    );

    setInputPrompt("");
    setIsThinking(true);

    try {
      // 1. Discover tools from MCP servers
      const toolMap = new Map<string, string>();
      const tools = [];

      for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        try {
          // Ensure server is started
          await invoke("start_mcp_server", {
            name: serverName,
            command: serverConfig.command || "",
            args: serverConfig.args || []
          });

          const listResponse = await invoke("send_mcp_request", {
            name: serverName,
            request: {
              jsonrpc: "2.0",
              id: "list_tools",
              method: "tools/list",
              params: {},
            },
          });

          const result = (listResponse as any).result?.tools || [];
          for (const tool of result) {
            toolMap.set(tool.name, serverName);
            tools.push({
              type: "function",
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema,
              },
            });
          }
        } catch (e) {
          console.error(`Failed to load tools from ${serverName}:`, e);
        }
      }

      let currentMessages = [...updatedMessages];
      let thinking = true;
      let finalContent = "";

      while (thinking) {
        const response = await sendOllamaChat(config.systemPrompt, currentMessages, tools);

        if (response.tool_calls && response.tool_calls.length > 0) {
          const assistantMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: response.content,
            tool_calls: response.tool_calls,
          };
          currentMessages.push(assistantMsg);

          for (const toolCall of response.tool_calls) {
            const toolName = toolCall.function.name;
            const args = toolCall.function.arguments;
            const serverName = toolMap.get(toolName);

            if (serverName) {
              try {
                const toolResult = await invoke("send_mcp_request", {
                  name: serverName,
                  request: {
                    jsonrpc: "2.0",
                    id: Date.now().toString(),
                    method: "tools/call",
                    params: {
                      name: toolName,
                      arguments: JSON.parse(args),
                    },
                  },
                });

                currentMessages.push({
                  id: Date.now().toString(),
                  role: "tool",
                  content: JSON.stringify(toolResult),
                  tool_call_id: toolCall.id,
                });
              } catch (e) {
                currentMessages.push({
                  id: Date.now().toString(),
                  role: "tool",
                  content: `Error executing tool ${toolName}: ${e}`,
                  tool_call_id: toolCall.id,
                });
              }
            } else {
              currentMessages.push({
                id: Date.now().toString(),
                role: "tool",
                content: `Tool ${toolName} not found on any configured MCP server.`,
                tool_call_id: toolCall.id,
              });
            }
          }
        } else {
          finalContent = response.content;
          thinking = false;
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: finalContent,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...currentMessages, assistantMsg] }
            : s
        )
      );
    } catch (err) {
      console.error("Chat error:", err);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...updatedMessages, { id: Date.now().toString(), role: "assistant", content: `Error: ${err}` }] }
            : s
        )
      );
    }

    setIsThinking(false);
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: t("new_chat_default_title"),
      messages: [],
    };
    setSessions([...sessions, newSession]);
    setCurrentSessionId(newId);
    setActiveTab("chat");
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const freshId = Date.now().toString();
      setSessions([{ id: freshId, title: t("new_chat_default_title"), messages: [] }]);
      setCurrentSessionId(freshId);
    } else {
      setSessions(filtered);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[filtered.length - 1].id);
      }
    }
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        darkMode ? "dark bg-[#1E1E1E] text-white" : "bg-[#F5F5F7] text-black"
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={handleLanguageChange}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        createNewChat={createNewChat}
        deleteSession={deleteSession}
        t={t}
      />

      <main className="flex-1 h-full relative">
        {activeTab === "chat" ? (
          <ChatCanvas
            session={activeSession}
            inputPrompt={inputPrompt}
            setInputPrompt={setInputPrompt}
            handleSend={handleSend}
            isThinking={isThinking}
            darkMode={darkMode}
            t={t}
          />
        ) : (
          <SettingsView config={config} saveConfig={setConfig} darkMode={darkMode} t={t} />
        )}
      </main>
    </div>
  );
}
