# ✨ Aurora Desktop Assistant

Aurora is a lightweight, cross-platform AI desktop assistant built with **Tauri v2**, **React 18**, **TypeScript**, and **Tailwind CSS**. Powered by local **Ollama** models (defaulting to `gemma4:31b-cloud`) and designed with support for the Model Context Protocol (MCP), Aurora delivers native workstation AI capabilities with an extremely small memory footprint (~30–50 MB RAM).

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

Ensure you have the following installed on your machine before setup:

1. **[Node.js](https://nodejs.org/)** (v18 or higher) and `npm`.
2. **[Ollama](https://ollama.com/)** installed and running locally.
3. **Rust Toolchain** (`rustc` and `cargo`).
4. **Platform Build Tools**:
* **macOS**: Xcode Command Line Tools (`xcode-select --install`).
* **Windows**: [Microsoft C++ Build Tools](https://www.google.com/search?q=https://visualstudio.microsoft.com/visual-cpp-build-tools/) and WebView2 runtime.
* **Linux**: Required packages (`webkit2gtk-4.1`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`).



---

## 🛠️ Installation & Setup

### 1. Install Rust Toolchain

If Rust and Cargo are not already installed, install them using `rustup` and load the environment into your current terminal:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

```

Verify the installation:

```bash
cargo --version

```

### 2. Pull the Ollama Model

Ensure Ollama is running in the background, then pull the required model:

```bash
ollama pull gemma4:31b-cloud

```

### 3. Install Node Dependencies

Navigate to your project root folder and run:

```bash
npm install

```

### 4. Generate Application Icons

Tauri requires asset icons inside `src-tauri/icons/` to build the app package. Generate placeholder icons with the following commands:

**macOS:**

```bash
mkdir -p src-tauri/icons
sips -s format png /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns --out base-icon.png
npx tauri icon base-icon.png
rm base-icon.png

```

**Windows / Linux:**
Place a 1024x1024 PNG named `app-icon.png` in the project root, then run:

```bash
npx tauri icon app-icon.png

```

### 5. Launch Development Server

Start the application with instant hot-reloading:

```bash
npm run tauri dev

```

---

## 📦 Building for Production

To package Aurora into a standalone native application executable (`.app`/`.dmg` on macOS, `.msi`/`.exe` on Windows, `.AppImage`/`.deb` on Linux):

```bash
npm run tauri build

```

Bundled binaries will be output inside `src-tauri/target/release/bundle/`.

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
│   ├── build.rs             # Tauri build script
│   ├── Cargo.toml           # Rust dependencies & build settings
│   ├── tauri.conf.json      # Window metadata & security policies
│   ├── icons/               # Platform app icons
│   └── src/
│       └── main.rs          # Native Rust entry point
└── src/
    ├── main.tsx             # React app mount point
    ├── App.tsx              # Root component & state management
    ├── index.css            # Global Tailwind directives & scrollbar styles
    ├── types.ts             # Data models & interface contracts
    ├── translations.ts      # Localization dictionaries & OS locale detector
    ├── components/
    │   ├── Sidebar.tsx       # macOS navigation sidebar
    │   ├── ChatCanvas.tsx    # Message stream & prompt input
    │   └── SettingsView.tsx  # MCP & system prompt preferences
    └── services/
        └── ollama.ts        # Async Ollama API client

```
