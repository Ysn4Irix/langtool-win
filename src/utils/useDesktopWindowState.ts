import { useState, useEffect, useCallback } from "react";
import {
  DesktopWindowState,
  getDesktopWindowState,
  toggleMiniMode as apiToggleMiniMode,
  togglePin as apiTogglePin,
  subscribeDesktopWindowState,
} from "../services/desktopBridge";
import { useToast } from "../context/ToastContext";

export function useDesktopWindowState() {
  const toast = useToast();
  const [windowState, setWindowState] = useState<DesktopWindowState>({
    mode: "studio",
    isPinned: false,
    isMiniMode: false,
  });

  useEffect(() => {
    // Initial fetch
    getDesktopWindowState().then(setWindowState);
    // Subscribe to push events from desktop backend
    const unsubscribe = subscribeDesktopWindowState(setWindowState);
    return () => unsubscribe();
  }, []);

  const toggleMiniMode = useCallback(async () => {
    const next = await apiToggleMiniMode();
    setWindowState(next);
    if (next.isMiniMode) {
      toast.info("Mini Mode enabled (Always-on-Top)");
    } else {
      toast.info("Studio Mode restored");
    }
  }, [toast]);

  const togglePin = useCallback(async () => {
    const next = await apiTogglePin();
    setWindowState(next);
    if (next.isPinned) {
      toast.success("Window pinned on top");
    } else {
      toast.info("Window unpinned");
    }
  }, [toast]);

  // Keyboard shortcut inside the app: Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        toggleMiniMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMiniMode]);

  return {
    ...windowState,
    toggleMiniMode,
    togglePin,
  };
}
