export interface DesktopWindowState {
  mode: "studio" | "mini";
  isPinned: boolean;
  isMiniMode: boolean;
}

declare global {
  interface Window {
    pywebview?: {
      api?: {
        get_window_state: () => Promise<DesktopWindowState>;
        toggle_mini_mode: () => Promise<DesktopWindowState>;
        set_mini_mode: (enable: boolean) => Promise<DesktopWindowState>;
        toggle_always_on_top: () => Promise<DesktopWindowState>;
        set_always_on_top: (enable: boolean) => Promise<DesktopWindowState>;
      };
    };
    __onDesktopWindowStateChanged?: (state: DesktopWindowState) => void;
  }
}

// Fallback simulated state for browser development
let simulatedState: DesktopWindowState = {
  mode: "studio",
  isPinned: false,
  isMiniMode: false,
};

const listeners = new Set<(state: DesktopWindowState) => void>();

// Attach global event listener for desktop backend notifications
if (typeof window !== "undefined") {
  window.__onDesktopWindowStateChanged = (state: DesktopWindowState) => {
    simulatedState = state;
    listeners.forEach((cb) => cb(state));
  };
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && !!window.pywebview?.api;
}

export async function getDesktopWindowState(): Promise<DesktopWindowState> {
  if (isDesktopApp() && window.pywebview?.api?.get_window_state) {
    try {
      const state = await window.pywebview.api.get_window_state();
      simulatedState = state;
      return state;
    } catch (e) {
      console.warn("Failed to get desktop window state:", e);
    }
  }
  return simulatedState;
}

export async function toggleMiniMode(): Promise<DesktopWindowState> {
  if (isDesktopApp() && window.pywebview?.api?.toggle_mini_mode) {
    try {
      const state = await window.pywebview.api.toggle_mini_mode();
      simulatedState = state;
      listeners.forEach((cb) => cb(state));
      return state;
    } catch (e) {
      console.warn("Failed to toggle mini mode via desktop bridge:", e);
    }
  }

  // Web fallback simulation
  const nextMode = simulatedState.mode === "studio" ? "mini" : "studio";
  simulatedState = {
    ...simulatedState,
    mode: nextMode,
    isMiniMode: nextMode === "mini",
    isPinned: nextMode === "mini" ? true : simulatedState.isPinned,
  };
  listeners.forEach((cb) => cb(simulatedState));
  return simulatedState;
}

export async function setMiniMode(enable: boolean): Promise<DesktopWindowState> {
  if (isDesktopApp() && window.pywebview?.api?.set_mini_mode) {
    try {
      const state = await window.pywebview.api.set_mini_mode(enable);
      simulatedState = state;
      listeners.forEach((cb) => cb(state));
      return state;
    } catch (e) {
      console.warn("Failed to set mini mode via desktop bridge:", e);
    }
  }

  simulatedState = {
    ...simulatedState,
    mode: enable ? "mini" : "studio",
    isMiniMode: enable,
    isPinned: enable ? true : simulatedState.isPinned,
  };
  listeners.forEach((cb) => cb(simulatedState));
  return simulatedState;
}

export async function togglePin(): Promise<DesktopWindowState> {
  if (isDesktopApp() && window.pywebview?.api?.toggle_always_on_top) {
    try {
      const state = await window.pywebview.api.toggle_always_on_top();
      simulatedState = state;
      listeners.forEach((cb) => cb(state));
      return state;
    } catch (e) {
      console.warn("Failed to toggle always on top via desktop bridge:", e);
    }
  }

  simulatedState = {
    ...simulatedState,
    isPinned: !simulatedState.isPinned,
  };
  listeners.forEach((cb) => cb(simulatedState));
  return simulatedState;
}

export function subscribeDesktopWindowState(
  callback: (state: DesktopWindowState) => void
): () => void {
  listeners.add(callback);
  // Emit current cached state immediately
  callback(simulatedState);
  return () => {
    listeners.delete(callback);
  };
}
