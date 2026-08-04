import React, { useState } from "react";
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
  
  const [config, setConfig] = useState<AppConfig>({
    language: detectOSLanguage(),
    systemPrompt: DEFAULT_SYSTEM_PROMPTS[detectOSLanguage()],
    mcpServers: {},
  });

  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "1", title: "New Chat", messages: [] },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("1");

  const t = (key: str): string => {
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

    const responseText = await sendOllamaChat(config.systemPrompt, updatedMessages);

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...s.messages, assistantMsg] }
          : s
      )
    );

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