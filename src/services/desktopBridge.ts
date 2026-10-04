export interface DesktopWindowState {
  mode: "studio" | "mini";
  isPinned: boolean;
  isMiniMode: boolean;
}

export interface DesktopBridgeApi {
  get_window_state: () => Promise<DesktopWindowState>;
  toggle_mini_mode: () => Promise<DesktopWindowState>;
  set_mini_mode: (enable: boolean) => Promise<DesktopWindowState>;
  toggle_always_on_top: () => Promise<DesktopWindowState>;
  set_always_on_top: (enable: boolean) => Promise<DesktopWindowState>;
}

declare global {
  interface Window {
    pywebview?: {
      api?: DesktopBridgeApi;
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

async function getApi(): Promise<DesktopBridgeApi | null> {
  if (typeof window === "undefined") return null;
  if (window.pywebview?.api) return window.pywebview.api;

  return new Promise<DesktopBridgeApi | null>((resolve) => {
    let done = false;
    const cleanup = () => {
      done = true;
      window.removeEventListener("pywebviewready", handleReady);
      clearInterval(interval);
      clearTimeout(timer);
    };
    const handleReady = () => {
      if (!done) {
        cleanup();
        resolve(window.pywebview?.api || null);
      }
    };
    window.addEventListener("pywebviewready", handleReady, { once: true });
    const interval = setInterval(() => {
      if (window.pywebview?.api) {
        cleanup();
        resolve(window.pywebview.api);
      }
    }, 30);
    const timer = setTimeout(() => {
      cleanup();
      resolve(window.pywebview?.api || null);
    }, 1500);
  });
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && !!window.pywebview?.api;
}

export async function getDesktopWindowState(): Promise<DesktopWindowState> {
  const api = await getApi();
  if (api?.get_window_state) {
    try {
      const state = await api.get_window_state();
      simulatedState = state;
      return state;
    } catch (e) {
      console.warn("Failed to get desktop window state:", e);
    }
  }
  return simulatedState;
}

export async function toggleMiniMode(): Promise<DesktopWindowState> {
  const api = await getApi();
  if (api?.toggle_mini_mode) {
    try {
      const state = await api.toggle_mini_mode();
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
  const api = await getApi();
  if (api?.set_mini_mode) {
    try {
      const state = await api.set_mini_mode(enable);
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
  const api = await getApi();
  if (api?.toggle_always_on_top) {
    try {
      const state = await api.toggle_always_on_top();
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
