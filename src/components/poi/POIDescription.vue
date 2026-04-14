<template>
  <article class="poi-description">
    <div class="description-header">
      <h2 class="section-label">About</h2>
    </div>

    <div ref="bodyEl" class="description-body" :class="{ collapsed: isLong && !expanded }">
      <p class="description-text">{{ text }}</p>
      <!-- Fade-out gradient shown only when collapsed -->
      <div v-if="isLong && !expanded" class="fade-out" />
    </div>

    <button v-if="isLong" class="expand-btn" @click="expanded = !expanded">
      {{ expanded ? '↑ Show less' : '↓ Read more' }}
    </button>
  </article>
</template>

<script setup lang="ts">

import { ref, onMounted } from "vue";

defineProps<{ text: string }>();

const COLLAPSE_THRESHOLD = 10; // lines — below this, never collapse

const bodyEl = ref<HTMLElement | null>(null);
const isLong = ref(false);
const expanded = ref(false);

onMounted(() => {
  const p = bodyEl.value?.querySelector('p');
  if (!p) return;
  const lineHeight = parseFloat(getComputedStyle(p).lineHeight);
  isLong.value = p.scrollHeight / lineHeight > COLLAPSE_THRESHOLD;
});
</script>

<style scoped>
.poi-description {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--color-border);
  text-align: left;
}

.description-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0;
}

/* ── Collapsible body ──────────────────────────────────────────────────── */
.description-body {
  position: relative;
}

.description-body.collapsed {
  /* 20 lines × 1.8 line-height × 1.05rem font ≈ 37.8rem, clamp to viewport-friendly value */
  max-height: calc(1.05rem * 1.8 * 20);
  overflow: hidden;
}

.fade-out {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rem;
  background: linear-gradient(to bottom, transparent, var(--color-surface));
  pointer-events: none;
}

.description-text {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Expand button ─────────────────────────────────────────────────────── */
.expand-btn {
  margin-top: 0.85rem;
  background: none;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;
}

.expand-btn:hover { opacity: 0.7; }
</style>
