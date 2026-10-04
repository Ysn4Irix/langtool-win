# LanguageTool Windows Desktop Client

A high-performance, ultra-lightweight Windows desktop application designed for real-time spelling and grammar checking powered by the self-hosted [LanguageTool API](https://langtool.ysnirix.xyz/v2/).

---

## ✨ Features

- 🪶 **Ultra-Lightweight & Fast**: Powered by native Windows Edge WebView2 (~20–30 MB RAM footprint, instantaneous startup).
- 〰️ **Native-Feel Wavy Underlines**:
  - 🔴 **Red wavy squiggle**: Spelling mistakes & typos (`misspelling`, `UnknownWord`)
  - 🟠 **Amber/Yellow wavy squiggle**: Grammar issues & punctuation (`grammar`, `GRAMMAR`)
  - 🔵 **Blue wavy squiggle**: Style, typography, and readability hints
- 💡 **Interactive Suggestion Popovers**:
  - Hover or click on any underlined word to view the rule explanation.
  - One-click replacement pills replace the text in-place.
  - "Ignore" option to dismiss false positives.
- 🪄 **Review & "Fix All" Panel**:
  - Collapsible side inspector categorizing all issues into Spelling, Grammar, and Style.
  - One-click **"Fix All"** button applies all top recommendations sequentially without offset corruption.
- 🌐 **60+ Languages & Auto-Detect**:
  - Automatic language detection enabled by default (`language=auto`).
  - Searchable dropdown supporting over 60 languages (English US/GB, Spanish, French, German, Arabic, etc.).
- 📥 **System Tray & Global Hotkey Integration**:
  - Closing the window (`X`) minimizes it directly to the Windows System Tray.
  - Global hotkey `Ctrl+Shift+L` instantly summons the window to the foreground from any app.
  - Right-click tray menu has quick actions: Open, Minimize to Tray, and Exit.
- ⌨️ **Keyboard Shortcuts**:
  - `Ctrl + Enter`: Trigger manual text check
  - `Ctrl + Shift + C`: Copy corrected text to clipboard
  - `Ctrl + Shift + L`: Summon app to front (global Windows hotkey)
  - `Esc`: Close open suggestion popover

---

## 🚀 Quick Start

### Option 1: Double-Click Launcher (Easiest)
Simply double-click `run.bat` in the project root.

### Option 2: Run via NPM
```bash
npm start
```

### Option 3: Run Silently (No Black Console Window)
Double-click `run-background.vbs` or run:
```bash
npm run start:silent
```

---

## 🛠️ Tech Stack & Architecture

- **Desktop Shell**: Python + `pywebview` (Microsoft Edge WebView2 Engine) + `pystray` (System Tray) + `keyboard` (Global Hotkeys).
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend API**: `https://langtool.ysnirix.xyz/v2/` (`/check` and `/languages`).
- **Offset Engine**: Custom Unicode offset recalculation and reverse-order multi-replace algorithm.
