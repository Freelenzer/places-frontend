<template>
  <RouterLink class="poi-card" :to="{ path: '/poi', query: { id: poi.id } }">
    <div class="card-image-wrapper">
      <img
        v-if="poi.image?.previewImageUrl"
        :src="poi.image.previewImageUrl"
        :alt="title"
        class="card-image"
        loading="lazy"
      />
      <div v-else class="card-image-placeholder">
        <span class="placeholder-icon">🗺️</span>
      </div>
      <span v-if="typeLabel" class="card-badge">{{ typeLabel }}</span>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ title }}</h3>
      <p v-if="description" class="card-description">{{ description }}</p>
      <span class="card-cta">Explore →</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getLocalized } from "../../utils/localization";
import { POI_TYPE_LABELS } from "../../utils/poiTypes";

const props = defineProps<{
  poi: {
    id: number;
    poiType?: number;
    image?: { previewImageUrl?: string } | null;
    titleTranslation?: Record<string, string>;
    descriptionTranslation?: Record<string, string>;
  };
}>();

const title = computed(() => getLocalized(props.poi.titleTranslation ?? null));
const typeLabel = computed(() =>
  props.poi.poiType != null ? POI_TYPE_LABELS[props.poi.poiType] ?? null : null
);
const description = computed(() => {
  const full = getLocalized(props.poi.descriptionTranslation ?? null);
  if (!full) return null;
  return full.length > 120 ? full.slice(0, 120).trimEnd() + "…" : full;
});

</script>

<style scoped>
.poi-card {
  text-decoration: none;
  color: inherit;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.poi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: var(--color-accent);
}

.poi-card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ── Image ─────────────────────────────────────────────────────────────────── */
.card-image-wrapper {
  position: relative;
  height: 160px;
  overflow: hidden;
  background: var(--color-surface-alt);
  flex-shrink: 0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.poi-card:hover .card-image {
  transform: scale(1.05);
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 2.5rem;
  opacity: 0.35;
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}

/* ── Body ──────────────────────────────────────────────────────────────────── */
.card-body {
  padding: 1.1rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.4rem;
}

.card-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
}

.card-description {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 0;
  flex: 1;
}

.card-cta {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.04em;
  margin-top: 0.4rem;
  transition: letter-spacing 0.2s ease;
}

.poi-card:hover .card-cta {
  letter-spacing: 0.1em;
}
</style>
