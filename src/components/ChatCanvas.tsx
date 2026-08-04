import React, { useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import { ChatSession } from "../types";

interface ChatCanvasProps {
  session: ChatSession;
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  handleSend: () => void;
  isThinking: boolean;
  darkMode: boolean;
  t: (key: string) => string;
}

export const ChatCanvas: React.FC<ChatCanvasProps> = ({
  session,
  inputPrompt,
  setInputPrompt,
  handleSend,
  isThinking,
  darkMode,
  t,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isThinking]);

  return (
    <div className="flex-1 flex flex-col justify-between p-6 h-full relative">
      {/* Invisible Top Drag Bar */}
      <div data-tauri-drag-region className="h-8 w-full shrink-0 select-none cursor-default" />

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {session.messages.length === 0 ? (
          <div data-tauri-drag-region className="flex flex-col items-center justify-center h-full text-center opacity-80">
            <Sparkles className="w-12 h-12 text-sky-400 mb-3 animate-pulse pointer-events-none" />
            <h2 data-tauri-drag-region className="text-3xl font-bold mb-1">{t("greeting_hello")}</h2>
            <p data-tauri-drag-region className="text-base opacity-60 mb-6">{t("greeting_sub")}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[t("chip_1"), t("chip_2"), t("chip_3")].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputPrompt(chip)}
                  className={`px-4 py-2 text-xs font-medium rounded-full transition ${
                    darkMode
                      ? "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white"
                      : "bg-[#E5E5EA] hover:bg-[#D1D1D6] text-black"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          session.messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              {m.role === "assistant" && (
                <span className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Aurora
                </span>
              )}
              <div
                className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : darkMode
                    ? "bg-[#2C2C2E] text-white border border-[#3A3A3C]"
                    : "bg-white text-black border border-[#E5E5EA] shadow-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {isThinking && (
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Aurora
            </span>
            <div
              className={`p-3.5 rounded-2xl text-sm opacity-60 ${
                darkMode ? "bg-[#2C2C2E] border border-[#3A3A3C]" : "bg-white border border-[#E5E5EA]"
              }`}
            >
              {t("thinking")}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating Prompt Input Bar */}
      <div className="mt-4 relative">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSend()}
          placeholder={t("ask_placeholder")}
          className={`w-full py-3.5 pl-4 pr-12 text-sm rounded-full outline-none border transition ${
            darkMode
              ? "bg-[#2C2C2E] border-[#3A3A3C] text-white focus:border-blue-500"
              : "bg-white border-[#E5E5EA] text-black focus:border-blue-500 shadow-sm"
          }`}
        />
        <button
          onClick={handleSend}
          disabled={isThinking}
          className="absolute right-2 top-1.5 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-center opacity-40 mt-1.5">{t("disclaimer")}</p>
      </div>
    </div>
  );
};
