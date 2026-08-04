# ✨ Aurora Desktop Assistant

Aurora is a lightweight, cross-platform AI desktop assistant built with **Tauri v2**, **React 18**, **TypeScript**, and **Tailwind CSS**. Powered by local **Ollama** models (defaulting to `gemma4:31b-cloud`) and designed with support for the Model Context Protocol (MCP), Aurora delivers native workstation AI capabilities with an extremely small footprint (~30–50 MB RAM).

---

## 🚀 Features

* **Ultra-Lightweight & Fast**: Powered by Tauri v2 and native OS webviews (WKWebView on macOS, Edge WebView2 on Windows, WebKitGTK on Linux).
* **Local LLM Execution**: Direct integration with local Ollama instances (`http://localhost:11434`).
* **Multilingual UI**: Native localization and system prompt synchronization for **English (US)**, **German (Germany)**, and **Turkish (Türkiye)** with automatic OS language detection.
* **Native macOS/Windows Aesthetics**: Built-in dark/light mode toggle, SF Pro-inspired typography, custom minimal scrollbars, and seamless sidebar navigation.
* **Chat Session Management**: Create, switch, and delete chat sessions on the fly.
* **MCP Server Preferences**: Configure and manage local (`stdio`) and remote (`sse`) Model Context Protocol servers.

---

## 📋 Prerequisites

Before setting up Aurora, ensure you have the following installed:

1. **[Node.js](https://nodejs.org/)** (v18 or higher) and `npm`.
2. **[Rust Toolchain](https://rustup.rs/)** (`rustc` and `cargo`).
3. **[Ollama](https://ollama.com/)** installed and running locally.
4. **Platform-Specific Dependencies**:
* **macOS**: Xcode Command Line Tools (`xcode-select --install`).
* **Windows**: [Microsoft C++ Build Tools](https://www.google.com/search?q=https://visualstudio.microsoft.com/visual-cpp-build-tools/) and WebView2 runtime (preinstalled on Windows 10/11).
* **Linux**: Required packages (`webkit2gtk-4.1`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`).



---

## 🛠️ Installation & Setup

### 1. Pull the Target Model

Ensure Ollama is running in the background, then pull the required model:

```bash
ollama pull gemma4:31b-cloud

```

### 2. Install Project Dependencies

Clone or open the project folder in your terminal and run:

```bash
npm install

```

### 3. Start Development Server

Run the application in development mode with instant hot-reloading:

```bash
npm run tauri dev

```

---

## 📦 Building for Production

To package Aurora into a standalone native application executable (`.app`/`.dmg` on macOS, `.msi`/`.exe` on Windows, `.AppImage`/`.deb` on Linux):

```bash
npm run tauri build

```

Bundled binaries will be generated inside `src-tauri/target/release/bundle/`.

---

## 📂 Project Structure

```text
aurora-desktop/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       └── main.rs          # Native Rust entry point
└── src/
    ├── main.tsx            # React app mount point
    ├── App.tsx             # Root component & state management
    ├── index.css           # Global Tailwind directives & scrollbar styles
    ├── types.ts            # Data models & interface contracts
    ├── translations.ts     # Localization dictionaries & OS locale detector
    ├── components/
    │   ├── Sidebar.tsx      # macOS navigation sidebar
    │   ├── ChatCanvas.tsx   # Message stream & prompt input
    │   └── SettingsView.tsx # MCP & system prompt preferences
    └── services/
        └── ollama.ts       # Async Ollama API client

```