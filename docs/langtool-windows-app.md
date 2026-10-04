# Plan: Lightweight Windows LanguageTool Client

## Goal
Build a lightweight, high-performance Windows desktop application using Tauri v2 (Rust + React + Vite + Tailwind CSS) connected to `https://langtool.ysnirix.xyz/v2/`, featuring real-time grammar/spelling checking, colored wavy underlines (red for spelling, yellow/orange for grammar, blue for style), interactive one-click replacement cards, 60+ language selector with auto-detect, and system tray integration.

## Tasks
- [x] Task 1: Initialize project with React, TypeScript, Tailwind CSS, and Lucide icons → Verify: Project compiles and Vite builds cleanly.
- [x] Task 2: Implement LanguageTool API client service (`/v2/check` and `/v2/languages`) with debounce, abort controller, and error handling → Verify: Automated integration test against `https://langtool.ysnirix.xyz/v2/` succeeds.
- [x] Task 3: Build the Underline Editor Engine with synchronized visual overlay (wavy underlines for typos, grammar, and style) → Verify: Typing errors shows exact-offset wavy colored underlines matching LanguageTool offsets.
- [x] Task 4: Implement interactive Suggestion Popovers with one-click replacements and ignore actions → Verify: Clicking a replacement cleanly updates the text in place and recalculates remaining offsets.
- [x] Task 5: Build Language Selector (with auto-detect and 60+ searchable languages) and Status Bar (word count, char count, error badge summary) → Verify: Language changes trigger re-check, and stats update live.
- [x] Task 6: Configure Windows desktop shell, System Tray icon, and keyboard shortcuts (`Ctrl+Enter` check, `Ctrl+Shift+L` summon, minimize to tray on close) → Verify: Window minimizes cleanly to tray and restores on click.
- [x] Task 7: End-to-end verification, styling polish, and Windows build test → Verify: App runs smoothly, consumes <30MB RAM, and passes quality audit.
- [x] Task 8: Implement Light Mode & Theme Engine (System / Light / Dark) with 1-click header toggle → Verify: Switching themes updates colors, squiggles, and popovers seamlessly.
- [x] Task 9: Implement Settings Modal with Custom API URL configuration & live connection tester → Verify: Custom URLs can be tested with `/languages`, persisted, and reset to default.

## Done When
- [x] The app launches as a native lightweight Windows app with zero bloat.
- [x] Text entered is checked against `https://langtool.ysnirix.xyz/v2/check`.
- [x] Errors are underlined with colored wavy lines (Red: spelling, Orange/Yellow: grammar, Blue: style).
- [x] Clicking an underlined word shows replacements and clicking a replacement updates the text.
- [x] Language detection and selection works smoothly.
- [x] System tray minimize works properly.
- [x] Light mode, Dark mode, and System theme synchronization work smoothly.
- [x] API URL can be customized, tested, and saved in settings.
- [x] Clean start with no hardcoded sample sentences; automatically preserves user draft text across restarts.
- [x] Clearer, more natural sentence rephrasing powered by Groq Cloud AI (Llama 3.3 70B) with 3 tone variations (Natural, Professional, Concise) and in-place replacement.

## Key Decisions & Edge Cases
1. **Underline Behavior**: Clear underline on the word being actively edited, refresh all wavy squiggles 500ms after user pauses typing to prevent misaligned visual jitter.
2. **Window Lifecycle**: Closing window (`X`) minimizes to system tray; global hotkey (`Ctrl+Shift+L`) summons app; tray context menu has "Quit" to fully terminate.
3. **Offset Handling**: Accurate Unicode slice handling so multi-byte/accented characters don't drift offsets.
4. **Draft Persistence**: User input is immediately persisted to local storage so any ongoing work is never lost between sessions or when minimized to tray. If cleared by the user, the editor starts clean.
5. **AI Sentence Rephrasing**: Powered strictly by Groq Cloud (`llama-3.1-8b-instant` default with dynamic model detection & auto-fallback) via JSON mode for blazing-fast (<250ms), reliable multi-tone variations without external library overhead. Triggerable via floating sentence button, error popover, or `Ctrl+Shift+R`.
