import React, { useState } from "react";
import { AppConfig, MCPServerConfig } from "../types";

interface SettingsViewProps {
  config: AppConfig;
  saveConfig: (updated: AppConfig) => void;
  darkMode: boolean;
  t: (key: string) => string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, saveConfig, darkMode, t }) => {
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [serverName, setServerName] = useState("");
  const [serverType, setServerType] = useState<"stdio" | "sse">("stdio");
  const [cmdUrl, setCmdUrl] = useState("");
  const [argsStr, setArgsStr] = useState("");

  const handleSavePrompt = () => {
    saveConfig({ ...config, systemPrompt });
  };

  const handleAddServer = () => {
    if (!serverName.trim() || !cmdUrl.trim()) return;

    const newServer: MCPServerConfig =
      serverType === "sse"
        ? { type: "sse", url: cmdUrl }
        : { type: "stdio", command: cmdUrl, args: argsStr.split(" ").filter(Boolean) };

    const updated = {
      ...config,
      mcpServers: { ...config.mcpServers, [serverName]: newServer },
    };

    saveConfig(updated);
    setServerName("");
    setCmdUrl("");
    setArgsStr("");
  };

  const handleRemoveServer = (name: string) => {
    const updatedServers = { ...config.mcpServers };
    delete updatedServers[name];
    saveConfig({ ...config, mcpServers: updatedServers });
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 p-6 overflow-y-auto h-full">
      <h2 className="text-2xl font-bold">{t("preferences")}</h2>

      {/* System Prompt */}
      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#2C2C2E] border-[#3A3A3C]" : "bg-white border-[#E5E5EA]"}`}>
        <h3 className="font-semibold mb-1 text-sm">{t("sys_prompt_title")}</h3>
        <p className="text-xs opacity-60 mb-3">{t("sys_prompt_desc")}</p>
        <textarea
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className={`w-full p-3 text-sm rounded-xl outline-none border ${
            darkMode ? "bg-[#1E1E1E] border-[#3A3A3C] text-white" : "bg-[#F5F5F7] border-[#E5E5EA] text-black"
          }`}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSavePrompt}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            {t("btn_save_prompt")}
          </button>
        </div>
      </div>

      {/* Add MCP Server */}
      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#2C2C2E] border-[#3A3A3C]" : "bg-white border-[#E5E5EA]"}`}>
        <h3 className="font-semibold mb-3 text-sm">{t("mcp_add_title")}</h3>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setServerType("stdio")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              serverType === "stdio" ? "bg-blue-600 text-white" : "opacity-60"
            }`}
          >
            {t("mcp_type_local")}
          </button>
          <button
            onClick={() => setServerType("sse")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              serverType === "sse" ? "bg-blue-600 text-white" : "opacity-60"
            }`}
          >
            {t("mcp_type_remote")}
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("server_name")}
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            className={`w-full p-2.5 text-xs rounded-lg outline-none border ${
              darkMode ? "bg-[#1E1E1E] border-[#3A3A3C] text-white" : "bg-[#F5F5F7] border-[#E5E5EA] text-black"
            }`}
          />
          <input
            type="text"
            placeholder={serverType === "sse" ? t("sse_url") : t("command")}
            value={cmdUrl}
            onChange={(e) => setCmdUrl(e.target.value)}
            className={`w-full p-2.5 text-xs rounded-lg outline-none border ${
              darkMode ? "bg-[#1E1E1E] border-[#3A3A3C] text-white" : "bg-[#F5F5F7] border-[#E5E5EA] text-black"
            }`}
          />
          {serverType === "stdio" && (
            <input
              type="text"
              placeholder={t("arguments")}
              value={argsStr}
              onChange={(e) => setArgsStr(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-lg outline-none border ${
                darkMode ? "bg-[#1E1E1E] border-[#3A3A3C] text-white" : "bg-[#F5F5F7] border-[#E5E5EA] text-black"
              }`}
            />
          )}
          <button
            onClick={handleAddServer}
            className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
          >
            {t("btn_add_server")}
          </button>
        </div>
      </div>

      {/* Configured MCP Servers List */}
      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#2C2C2E] border-[#3A3A3C]" : "bg-white border-[#E5E5EA]"}`}>
        <h3 className="font-semibold mb-3 text-sm">{t("mcp_list_title")}</h3>
        {Object.keys(config.mcpServers).length === 0 ? (
          <p className="text-xs opacity-50">{t("no_mcp_servers")}</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(config.mcpServers).map(([name, s]) => (
              <div
                key={name}
                className={`p-3 rounded-xl flex items-center justify-between ${
                  darkMode ? "bg-[#1E1E1E]" : "bg-[#F5F5F7]"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">🟢 {name}</div>
                  <div className="text-[10px] opacity-60">
                    {s.type === "sse" ? s.url : `${s.command} ${(s.args || []).join(" ")}`}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveServer(name)}
                  className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition"
                >
                  {t("btn_remove")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};