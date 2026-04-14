import { ref } from "vue";

// Shared singleton — set once at startup, read everywhere
const isPublic = ref(false);

export async function initPublicMode(): Promise<void> {
  try {
    const res = await fetch("/config.json");
    if (res.ok) {
      const config = await res.json();
      isPublic.value = config.publicMode === true;
    }
  } catch {
    // Network error or missing file → default to full CMS mode
  }
}

export function usePublicMode() {
  return { isPublic };
}
