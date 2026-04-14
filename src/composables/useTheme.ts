import { ref, watch, onMounted, onUnmounted } from "vue";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "poi-theme";

// Shared singleton state across all component instances
const current = ref<Theme>("system");

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

function persist(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

function load(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {}
  return "system";
}

export function useTheme() {
  // Keep data-theme in sync whenever `current` changes
  watch(current, (theme) => {
    applyTheme(theme);
    persist(theme);
  });

  // React to OS-level changes when theme is "system"
  let mq: MediaQueryList | null = null;
  const onOsChange = () => {
    if (current.value === "system") applyTheme("system");
  };

  onMounted(() => {
    // Only initialise once (singleton guard)
    if (!document.documentElement.hasAttribute("data-theme")) {
      current.value = load();
      applyTheme(current.value);
    }
    mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onOsChange);
  });

  onUnmounted(() => {
    mq?.removeEventListener("change", onOsChange);
  });

  function toggle() {
    // Cycle: system → light → dark → system
    const cycle: Theme[] = ["system", "light", "dark"];
    const idx = cycle.indexOf(current.value);
    current.value = cycle[(idx + 1) % cycle.length];
  }

  function setTheme(theme: Theme) {
    current.value = theme;
  }

  return { theme: current, toggle, setTheme };
}

/**
 * Call this in main.ts BEFORE app.mount() to prevent a flash of wrong theme.
 * import { initTheme } from './composables/useTheme'
 * initTheme()
 */
export function initTheme() {
  const stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) as Theme | null;
    } catch {
      return null;
    }
  })();
  const theme: Theme =
    stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}
