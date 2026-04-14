<template>
  <!-- Sticky top bar -->
  <div class="sticky-bar">
    <div class="sticky-inner">
      <button class="glass-btn" @click="$router.back()">
        <span>←</span> Back
      </button>

      <RouterLink class="app-wordmark" to="/">Bucket List</RouterLink>

      <div class="sticky-title-group" :class="{ visible: scrolled }">
        <h2 class="sticky-title">{{ title }}</h2>
      </div>

      <ThemeToggle />
    </div>
  </div>

  <!-- Hero image -->
  <header class="poi-hero">
    <div class="hero-image-wrapper">
      <img
        v-if="image?.imageUrl"
        :src="image.imageUrl"
        :alt="title"
        class="hero-image"
      />
      <div class="hero-overlay" />
    </div>


    <div class="hero-content">
      <div class="hero-title-group">
        <h1 class="hero-title">{{ title }}</h1>
        <button
          v-if="!isPublic"
          class="title-edit-btn"
          aria-label="Edit title"
          @click="$emit('editTitle')"
        >✏️</button>
      </div>

      <div class="hero-footer">
        <a
          v-if="image?.sourceUrl"
          :href="image.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="image-credit"
        >
          {{ image.author ? `Photo by ${image.author}` : 'View source' }} ↗
        </a>
        <button v-if="!isPublic" class="edit-btn glass-btn" @click="$emit('editImage')">
          ✏️ Edit photo
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import ThemeToggle from "../ui/ThemeToggle.vue";
import { usePublicMode } from "../../composables/usePublicMode";

defineProps<{
  image: {
    imageUrl?: string;
    previewImageUrl?: string;
    sourceUrl?: string;
    author?: string;
    id?: number;
  } | null;
  title: string;
}>();

defineEmits<{ editImage: []; editTitle: [] }>();

const { isPublic } = usePublicMode();

const scrolled = ref(false);
function onScroll() { scrolled.value = window.scrollY > 60; }
onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<style scoped>
/* ── Sticky bar ─────────────────────────────────────────────────────────── */
.sticky-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(247, 245, 242, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.3s ease, border-color 0.3s ease;
}

[data-theme="dark"] .sticky-bar {
  background: rgba(22, 19, 15, 0.85);
}

.sticky-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-wordmark {
  text-decoration: none;
  background: none;
  border: none;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.app-wordmark:hover { opacity: 0.75; }

/* ── Sticky title + hover-edit group ───────────────────────────────────── */
.sticky-title-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sticky-title-group.visible {
  opacity: 1;
  transform: translateY(0);
}

.sticky-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Hero title + hover-reveal edit group ───────────────────────────────── */
.hero-title-group {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 5vw, 3.6rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 16px rgba(0,0,0,0.4);
  margin: 0;
}

/* Hidden by default, shown on hover on pointer devices only */
.title-edit-btn {
  flex-shrink: 0;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  backdrop-filter: blur(6px);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.3rem 0.45rem;
  line-height: 1;
  color: #fff;
  /* Start invisible, slightly below */
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.18s ease, transform 0.18s ease, background 0.15s;
  /* Touch devices: always visible */
  display: inline-flex;
  align-items: center;
  /* Sit at the bottom of the title baseline */
  margin-bottom: 0.15rem;
}

.title-edit-btn:hover {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.5);
}

/* On pointer devices: hide until the title group is hovered */
@media (hover: hover) and (pointer: fine) {
  .title-edit-btn {
    opacity: 0;
    transform: translateY(4px);
  }

  .hero-title-group:hover .title-edit-btn {
    opacity: 1;
    transform: translateY(0);
  }
}

/* On touch: always show so mobile users can tap it */
@media (hover: none) {
  .title-edit-btn {
    opacity: 1;
    transform: none;
  }
}
.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}

.glass-btn:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-accent);
}

/* ── Hero image ─────────────────────────────────────────────────────────── */
.poi-hero {
  position: relative;
  /* Scales with viewport so the image never becomes an ultra-thin strip.
     30vw = ~432px at 1440px wide, capped at 580px on ultrawide. */
  height: clamp(320px, 30vw, 580px);
  overflow: hidden;
  background: var(--color-surface-alt);
}

/* ── Hero image ─────────────────────────────────────────────────────────── */

.hero-image-wrapper {
  position: absolute;
  inset: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Bottom gradient for text legibility */
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 1.25rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.75rem;
  box-sizing: border-box;
}

.hero-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* No wrapping — keep credit and button on one line */
  flex-wrap: nowrap;
  gap: 0.5rem;
  /* Prevent the row from growing wider than the hero */
  width: 100%;
  min-width: 0;
}

.image-credit {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  transition: color 0.2s;
  /* Allow the credit to shrink so the button always stays visible */
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-credit:hover { color: rgba(255,255,255,0.9); }

.edit-btn {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.3);
  color: #fff;
  backdrop-filter: blur(8px);
  /* Never let the button shrink or get pushed off screen */
  flex-shrink: 0;
}

.edit-btn:hover {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.6);
}

@media (max-width: 600px) {
  .poi-hero { height: 240px; }
  .sticky-inner { padding: 0.6rem 0.85rem; }
  .hero-content { padding: 1rem 0.85rem 1.1rem; }
}
</style>