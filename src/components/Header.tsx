import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Globe,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { Language, DetectedLanguage } from "../types/langtool";
import { ThemePreference } from "../utils/useTheme";

interface HeaderProps {
  languages: Language[];
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  detectedLanguage?: DetectedLanguage;
  isChecking: boolean;
  onManualCheck: () => void;
  onClearText: () => void;
  onCopyText: () => void;
  isCopied: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  issueCounts: { spelling: number; grammar: number; style: number; total: number };
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  languages,
  selectedLanguage,
  onSelectLanguage,
  detectedLanguage,
  isChecking,
  onManualCheck,
  onClearText,
  onCopyText,
  isCopied,
  showSidebar,
  onToggleSidebar,
  issueCounts,
  resolvedTheme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangObj = languages.find(
    (l) => l.code === selectedLanguage || l.longCode === selectedLanguage
  );
  const currentLangLabel =
    selectedLanguage === "auto"
      ? detectedLanguage
        ? `Auto (${detectedLanguage.name})`
        : "Auto-detect"
      : currentLangObj?.name || selectedLanguage;

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between select-none z-30 transition-colors">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-sm tracking-tighter">
          lt
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight lowercase">
              langtool
            </h1>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-300/60 dark:border-sky-800/60">
              Desktop
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
            Spelling & Grammar Assistant
          </p>
        </div>
      </div>

      {/* Center Controls: Language Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-inner"
        >
          <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span className="max-w-[150px] truncate">{currentLangLabel}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              langDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {langDropdownOpen && (
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 max-h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
            </div>

            <div className="overflow-y-auto max-h-60 py-1">
              {/* Auto detect option */}
              <button
                onClick={() => {
                  onSelectLanguage("auto");
                  setLangDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
                  selectedLanguage === "auto"
                    ? "text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-500/10"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Auto-detect</span>
                </div>
                {selectedLanguage === "auto" && (
                  <Check className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                )}
              </button>

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 mx-2" />

              {/* Language list */}
              {filteredLanguages.map((lang) => {
                const isSelected =
                  selectedLanguage === lang.code || selectedLanguage === lang.longCode;
                return (
                  <button
                    key={lang.longCode || lang.code}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
                      isSelected
                        ? "text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-500/10"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate">{lang.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-2 uppercase">
                      {lang.code}
                    </span>
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400">No language found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Manual Recheck button */}
        <button
          onClick={onManualCheck}
          disabled={isChecking}
          title="Check text now (Ctrl+Enter)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/70 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${
              isChecking ? "animate-spin text-sky-500 dark:text-sky-400" : ""
            }`}
          />
          <span className="hidden sm:inline">Check</span>
        </button>

        {/* Copy button */}
        <button
          onClick={onCopyText}
          title="Copy text (Ctrl+Shift+C)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isCopied
              ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          )}
          <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
        </button>

        {/* Clear button */}
        <button
          onClick={onClearText}
          title="Clear all text"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Quick Theme Toggle (Sun / Moon) */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Settings (API URL, Theme)"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          title="Toggle Review Panel"
          className={`relative p-1.5 rounded-lg border transition-colors ${
            showSidebar
              ? "bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/50 text-sky-700 dark:text-sky-300"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {issueCounts.total > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
              {issueCounts.total > 9 ? "9+" : issueCounts.total}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
