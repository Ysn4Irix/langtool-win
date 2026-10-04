import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "./components/Header";
import { Editor } from "./components/Editor";
import { IssuesPanel } from "./components/IssuesPanel";
import { StatusBar } from "./components/StatusBar";
import { SettingsModal } from "./components/SettingsModal";
import { Language, Match, DetectedLanguage } from "./types/langtool";
import { getLanguages, checkText, getStoredApiUrl } from "./services/langtoolApi";
import { applyReplacement, applyAllReplacements, getStats } from "./utils/textUtils";
import { useTheme } from "./utils/useTheme";

const INITIAL_SAMPLE_TEXT = `This are a test for spelling and grammer mistaks. She have a apple every morning because it keep the doctor away. LanguageTool help you find mistakes that simple spell check cannot detects.`;

export default function App() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const [text, setText] = useState<string>(INITIAL_SAMPLE_TEXT);
  const [language, setLanguage] = useState<string>("auto");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<DetectedLanguage | undefined>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>(getStoredApiUrl);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load languages whenever apiUrl changes
  const loadLanguages = useCallback(async (currentUrl?: string) => {
    try {
      const langs = await getLanguages(currentUrl);
      setLanguages(langs);
      setApiConnected(true);
    } catch (err) {
      console.error("Failed to load languages:", err);
      setApiConnected(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages(apiUrl);
  }, [apiUrl, loadLanguages]);

  // Perform API check
  const runCheck = useCallback(
    async (textToCheck: string, langToCheck: string, endpointUrl?: string) => {
      if (!textToCheck.trim()) {
        setMatches([]);
        setIsChecking(false);
        return;
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsChecking(true);
      try {
        const response = await checkText(
          textToCheck,
          langToCheck,
          abortControllerRef.current.signal,
          endpointUrl || apiUrl
        );

        setApiConnected(true);
        if (response.language?.detectedLanguage) {
          setDetectedLanguage(response.language.detectedLanguage);
        }

        // Filter out ignored issues
        const active = response.matches.filter((m) => !ignoredIds.has(m.id));
        setMatches(active);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("LanguageTool check error:", err);
          setApiConnected(false);
        }
      } finally {
        setIsChecking(false);
      }
    },
    [apiUrl, ignoredIds]
  );

  // Debounced check on text or language change (500ms debounce)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runCheck(text, language, apiUrl);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [text, language, apiUrl, runCheck]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter -> Manual check
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        runCheck(text, language, apiUrl);
      }
      // Ctrl+Shift+C -> Copy text
      if (e.ctrlKey && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleCopyText();
      }
      // Ctrl+, -> Open settings
      if (e.ctrlKey && e.key === ",") {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, language, apiUrl, runCheck]);

  // Handlers
  const handleApplyReplacement = (match: Match, replacement: string) => {
    const newText = applyReplacement(text, match, replacement);
    setText(newText);
    setSelectedMatch(null);
  };

  const handleApplyAll = () => {
    const newText = applyAllReplacements(text, visibleMatches);
    setText(newText);
    setSelectedMatch(null);
  };

  const handleIgnore = (matchId: string) => {
    setIgnoredIds((prev) => new Set(prev).add(matchId));
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    if (selectedMatch?.id === matchId) {
      setSelectedMatch(null);
    }
  };

  const handleClearText = () => {
    setText("");
    setMatches([]);
    setSelectedMatch(null);
  };

  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleApiUrlChanged = (newUrl: string) => {
    setApiUrl(newUrl);
    loadLanguages(newUrl);
    runCheck(text, language, newUrl);
  };

  const visibleMatches = matches.filter((m) => !ignoredIds.has(m.id));

  const issueCounts = {
    spelling: visibleMatches.filter((m) => m.categoryType === "spelling").length,
    grammar: visibleMatches.filter((m) => m.categoryType === "grammar").length,
    style: visibleMatches.filter((m) => m.categoryType === "style").length,
    total: visibleMatches.length,
  };

  const stats = getStats(text);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* Top Header */}
      <Header
        languages={languages}
        selectedLanguage={language}
        onSelectLanguage={setLanguage}
        detectedLanguage={detectedLanguage}
        isChecking={isChecking}
        onManualCheck={() => runCheck(text, language, apiUrl)}
        onClearText={handleClearText}
        onCopyText={handleCopyText}
        isCopied={isCopied}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        issueCounts={issueCounts}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace: Editor + Review Panel */}
      <main className="flex-1 flex overflow-hidden relative">
        <Editor
          text={text}
          onChangeText={setText}
          matches={visibleMatches}
          selectedMatch={selectedMatch}
          onSelectMatch={setSelectedMatch}
          onApplyReplacement={handleApplyReplacement}
          onIgnoreMatch={handleIgnore}
          isChecking={isChecking}
        />

        {showSidebar && (
          <IssuesPanel
            matches={visibleMatches}
            selectedMatchId={selectedMatch?.id}
            onSelectIssue={setSelectedMatch}
            onApplyReplacement={handleApplyReplacement}
            onApplyAll={handleApplyAll}
            onIgnore={handleIgnore}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        words={stats.words}
        chars={stats.chars}
        sentences={stats.sentences}
        readingTimeSec={stats.readingTimeSec}
        isChecking={isChecking}
        issueCount={issueCounts.total}
        apiConnected={apiConnected}
        detectedLanguageName={detectedLanguage?.name}
        apiUrl={apiUrl}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
        onApiUrlChanged={handleApiUrlChanged}
      />
    </div>
  );
}
