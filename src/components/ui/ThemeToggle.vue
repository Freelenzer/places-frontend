<template>
  <button
    class="theme-switch"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <span class="track" :class="{ 'is-dark': isDark }">
      <!-- Decorative stars, visible in dark mode -->
      <span class="star s1" />
      <span class="star s2" />
      <span class="star s3" />

      <!-- Sliding thumb -->
      <span class="thumb">
        <span class="thumb-icon">{{ isDark ? '🌙' : '☀️' }}</span>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "../../composables/useTheme";

const { theme, setTheme } = useTheme();

const isDark = computed(
  () =>
    theme.value === "dark" ||
    (theme.value === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
);

function toggle() {
  setTheme(isDark.value ? "light" : "dark");
}
</script>

<style scoped>
/* ── Button reset ─────────────────────────────────────────────────────────── */
.theme-switch {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  /* Opt out of the global color transition — this element has its own */
  transition: none;
}

/* ── Track ────────────────────────────────────────────────────────────────── */
.track {
  position: relative;
  display: flex;
  align-items: center;
  width: 56px;
  height: 28px;
  border-radius: 999px;
  /* Light state */
  background: rgba(255, 255, 255, 0.22);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  /* Only transition the visual properties we care about */
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.2s ease;
}

/* Dark state */
.track.is-dark {
  background: rgba(20, 14, 50, 0.70);
  border-color: rgba(255, 255, 255, 0.18);
}

/* ── Stars ────────────────────────────────────────────────────────────────── */
.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  /* Only transition opacity */
  transition: opacity 0.35s ease;
  opacity: 0;
}

.track.is-dark .star { opacity: 1; }

.s1 { width: 3px; height: 3px; top:  6px; left:  7px; }
.s2 { width: 2px; height: 2px; top: 15px; left: 13px; }
.s3 { width: 2px; height: 2px; top:  9px; left: 18px; }

/* ── Thumb ─────────────────────────────────────────────────────────────────── */
.thumb {
  position: absolute;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Animate the slide AND the background colour */
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1),
              background 0.4s ease;
}

.track.is-dark .thumb {
  transform: translateX(28px);
  background: #1e1440;
}

/* ── Emoji inside thumb ────────────────────────────────────────────────────── */
.thumb-icon {
  font-size: 13px;
  line-height: 1;
  display: block;
  transition: none; /* emoji swap is instant — no colour lerp needed */
}

/* ── Hover & focus ────────────────────────────────────────────────────────── */
.theme-switch:hover .track {
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255,255,255,0.12);
}

.theme-switch:focus-visible .track {
  outline: 2px solid #fff;
  outline-offset: 3px;
}
</style>