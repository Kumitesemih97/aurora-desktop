import React from "react";
import { Sparkles, MessageSquare, Settings, Plus, Trash2, Sun, Moon } from "lucide-react";
import { ChatSession } from "../types";
import { LANGUAGES, LANG_CODES_TO_NAMES } from "../translations";

interface SidebarProps {
  activeTab: "chat" | "settings";
  setActiveTab: (tab: "chat" | "settings") => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  setCurrentSessionId: (id: string) => void;
  createNewChat: () => void;
  deleteSession: (id: string, e: React.MouseEvent) => void;
  t: (key: string) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  createNewChat,
  deleteSession,
  t,
}) => {
  return (
    <aside
      className={`w-64 flex flex-col justify-between border-r ${
        darkMode ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-[#F2F2F7] border-[#E5E5EA]"
      }`}
    >
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 pt-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" /> Aurora
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg transition ${
              darkMode ? "hover:bg-[#2C2C2E]" : "hover:bg-[#E5E5EA]"
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === "chat" ? "bg-blue-600 text-white shadow-sm" : "opacity-70 hover:opacity-100"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> {t("chat")}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === "settings" ? "bg-blue-600 text-white shadow-sm" : "opacity-70 hover:opacity-100"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> {t("settings")}
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={createNewChat}
          className="w-full py-2 px-3 mb-4 rounded-xl border border-blue-500 text-blue-500 font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-500/10 transition"
        >
          <Plus className="w-4 h-4" /> {t("new_chat")}
        </button>

        {/* Recent Chats */}
        <div className="text-xs font-semibold opacity-50 uppercase tracking-wider mb-2 px-1">
          {t("recent_chats")}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.length === 0 ? (
            <div className="text-xs opacity-50 px-2 py-1">{t("no_recent_chats")}</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setActiveTab("chat");
                }}
                className={`group flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition ${
                  s.id === currentSessionId
                    ? darkMode
                      ? "bg-[#2C2C2E]"
                      : "bg-[#E5E5EA]"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate">{s.title}</span>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Language Controls */}
      <div className="p-4 border-t border-black/5 dark:border-white/5 space-y-2">
        <label className="text-xs opacity-60 block">{t("language_select")}</label>
        <select
          value={LANG_CODES_TO_NAMES[language]}
          onChange={(e) => setLanguage(LANGUAGES[e.target.value])}
          className={`w-full p-2 text-xs rounded-lg outline-none border ${
            darkMode ? "bg-[#2C2C2E] border-[#3A3A3C] text-white" : "bg-white border-[#E5E5EA] text-black"
          }`}
        >
          {Object.keys(LANGUAGES).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
};