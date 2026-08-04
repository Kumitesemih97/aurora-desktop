# ✨ Aurora Desktop Assistant

Aurora is a lightweight, cross-platform AI desktop workstation assistant built with **TypeScript (React 18)** and **Rust (Tauri v2)**. Powered by local **Ollama** LLMs (defaulting to `gemma4:31b-cloud`), Aurora provides an intuitive, high-performance chat client capable of connecting with Model Context Protocol (MCP) servers while maintaining an ultra-lightweight footprint (~30–50 MB RAM).

---

## 🛠️ Tech Stack & Language Support

* **UI & Frontend**: TypeScript, React 18, Vite, Tailwind CSS, Lucide Icons.
* **Desktop Runtime**: Rust, Tauri v2 (utilizing native OS WebViews: WKWebView on macOS, Edge WebView2 on Windows, WebKitGTK on Linux).
* **AI Core**: Ollama REST API (`http://localhost:11434`).
* **Supported Languages**:
* 🇺🇸 **English (US)** (`en`)
* 🇩🇪 **German (Germany)** (`de`)
* 🇹🇷 **Turkish (Türkiye)** (`tr`)


* **Locale Handling**: Automatic OS language detection with manual runtime override via UI.

---

## 🚀 Key Functionality

1. **Local LLM Chat Engine**: Fully private, offline-capable AI interface interacting directly with local Ollama models.
2. **MCP Integration Panel**: In-app management interface to register, monitor, and remove local standard I/O (`stdio`) and remote (`sse`) Model Context Protocol servers.
3. **Multi-Session Management**: Create, switch, rename, and delete conversation threads stored within application state.
4. **macOS & Windows Native Aesthetics**: Auto-adapts to system light/dark mode, featuring clean typography, translucent container styling, and auto-hiding scrollbars.

---

## 📋 Prerequisites

Ensure the following tools are installed on your machine before setup:

1. **[Node.js](https://nodejs.org/)** (v18 or higher) and `npm`.
2. **[Ollama](https://ollama.com/)** installed and running.
3. **Rust Toolchain** (`rustc` and `cargo`).
4. **OS Build Tools**:
* **macOS**: Xcode Command Line Tools (`xcode-select --install`).
* **Windows**: [Microsoft C++ Build Tools](https://www.google.com/search?q=https://visualstudio.microsoft.com/visual-cpp-build-tools/) and WebView2 runtime.
* **Linux**: Required GTK/WebKit packages (`webkit2gtk-4.1`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`).



---

## ⚙️ Initial Project Setup

### 1. Install Rust Toolchain

If Rust is not installed, set up `rustup` and load Cargo into your current terminal shell:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

```

Verify the installation:

```bash
cargo --version

```

### 2. Pull Ollama Model

Start Ollama, then pull the required model:

```bash
ollama pull gemma4:31b-cloud

```

### 3. Install Node Dependencies

Navigate to the project root directory and run:

```bash
npm install

```

### 4. Generate Application Icons

Tauri requires valid binary icons in `src-tauri/icons/` to run:

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

---

## 🖥️ Running in Development Mode

Development mode runs a local Vite server for front-end Hot Module Replacement (HMR) and compiles the Rust backend binaries in debug mode.

### Step-by-Step Guide

1. **Verify Ollama is Running**:
Ensure Ollama is active in the background. You can verify by visiting `http://localhost:11434` in your browser or executing:
```bash
ollama list

```


2. **Load Environment Variables (if needed)**:
In your terminal, ensure Cargo is accessible:
```bash
source "$HOME/.cargo/env"

```


3. **Start the Development Server**:
From the project root directory, run:
```bash
npm run tauri dev

```


4. **What Happens Next**:
* Vite starts a local dev server at `http://localhost:5173`.
* Cargo compiles the native Rust backend wrapper in `src-tauri/`.
* The native desktop window launches automatically.
* Any edits made to files in `src/` will instantly reload in the app window without restarting.



---

## 📦 Building & Running in Production Mode

Production mode compiles your React UI into optimized static assets and bundles the Rust backend into a standalone, distribution-ready native executable installer.

### Step-by-Step Guide

1. **Trigger the Production Build**:
From the project root directory, run:
```bash
npm run tauri build

```


2. **Build Artifact Locations**:
Once compilation completes, Tauri places the final installers and standalone binaries inside `src-tauri/target/release/bundle/`:
* **macOS**:
* Standalone App: `src-tauri/target/release/bundle/macos/Aurora.app`
* Disk Image Installer: `src-tauri/target/release/bundle/dmg/Aurora_0.1.0_aarch64.dmg`


* **Windows**:
* MSI Installer: `src-tauri/target/release/bundle/msi/Aurora_0.1.0_x64_en-US.msi`
* Executable: `src-tauri/target/release/Aurora.exe`


* **Linux**:
* AppImage: `src-tauri/target/release/bundle/appimage/aurora-desktop_0.1.0_amd64.AppImage`
* Debian Package: `src-tauri/target/release/bundle/deb/aurora-desktop_0.1.0_amd64.deb`




3. **Running the Built Production App**:
* **macOS**:
Double-click `Aurora.app` inside `src-tauri/target/release/bundle/macos/`, or drag `Aurora_0.1.0_aarch64.dmg` to your `/Applications` folder.
*To run via terminal:*
```bash
open src-tauri/target/release/bundle/macos/Aurora.app

```


* **Windows**:
Run the `.msi` installer to install Aurora system-wide, or run `Aurora.exe` directly from `src-tauri/target/release/`.
* **Linux**:
Make the AppImage executable and launch it:
```bash
chmod +x src-tauri/target/release/bundle/appimage/aurora-desktop_0.1.0_amd64.AppImage
./src-tauri/target/release/bundle/appimage/aurora-desktop_0.1.0_amd64.AppImage

```





---

## 📂 Project Structure

```text
aurora-desktop/
├── index.html               # Main HTML entry point
├── package.json             # Node dependencies & Tauri CLI scripts
├── postcss.config.js        # PostCSS configuration for Tailwind
├── tailwind.config.js       # Tailwind CSS styling configuration
├── tsconfig.json            # TypeScript compiler configuration
├── src-tauri/
│   ├── build.rs             # Native Rust build script
│   ├── Cargo.toml           # Rust crate dependencies
│   ├── tauri.conf.json      # Window options, icons, & security policies
│   ├── icons/               # Compiled application platform icons
│   └── src/
│       └── main.rs          # Native Rust desktop entry point
└── src/
    ├── main.tsx             # React application mount point
    ├── App.tsx              # Root component & central state
    ├── index.css            # Global Tailwind directives & scrollbar styles
    ├── types.ts             # Data interfaces & type contracts
    ├── translations.ts      # Multi-language strings & OS locale detector
    ├── components/
    │   ├── Sidebar.tsx       # Navigation, dark mode, & chat list
    │   ├── ChatCanvas.tsx    # Message history & input area
    │   └── SettingsView.tsx  # System prompt & MCP server setup
    └── services/
        └── ollama.ts        # Async Ollama HTTP client service

```
