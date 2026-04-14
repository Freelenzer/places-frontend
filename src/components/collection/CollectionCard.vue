<template>
  <RouterLink class="collection-card" :to="{ path: '/collection', query: { id: collection.id } }">
    <!-- 2×2 mosaic of POI thumbnails -->
    <div class="card-mosaic">
      <template v-if="thumbs.length">
        <div
          v-for="(thumb, i) in thumbs"
          :key="i"
          class="mosaic-cell"
        >
          <img v-if="thumb" :src="thumb" :alt="title" loading="lazy" />
          <div v-else class="mosaic-placeholder"><span>🗺️</span></div>
        </div>
      </template>
      <div v-else class="mosaic-empty"><span>🗺️</span></div>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ title }}</h3>
      <span class="card-count">{{ collection.pois?.length ?? 0 }} places</span>
      <span class="card-cta">View →</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getLocalized } from "../../utils/localization";

const props = defineProps<{
  collection: {
    id: number;
    titleTranslation?: Record<string, string>;
    pois?: { poi: { image?: { previewImageUrl?: string } | null } }[];
  };
}>();

const title = computed(() => getLocalized(props.collection.titleTranslation ?? null));

const thumbs = computed(() => {
  const slots = 4;
  const pois = props.collection.pois ?? [];
  return Array.from({ length: slots }, (_, i) =>
    pois[i]?.poi?.image?.previewImageUrl ?? null
  );
});

</script>

<style scoped>
.collection-card {
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

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: var(--color-accent);
}

.collection-card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ── Mosaic ─────────────────────────────────────────────────────────────────── */
.card-mosaic {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 80px 80px;
  overflow: hidden;
  flex-shrink: 0;
}

.mosaic-cell {
  overflow: hidden;
  background: var(--color-surface-alt);
}

.mosaic-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.collection-card:hover .mosaic-cell img {
  transform: scale(1.05);
}

.mosaic-placeholder,
.mosaic-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0.3;
}

.mosaic-empty {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  font-size: 2.5rem;
  height: 160px;
}

/* ── Body ───────────────────────────────────────────────────────────────────── */
.card-body {
  padding: 1rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.3rem;
}

.card-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
}

.card-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  flex: 1;
}

.card-cta {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.04em;
  margin-top: 0.25rem;
  transition: letter-spacing 0.2s ease;
}

.collection-card:hover .card-cta {
  letter-spacing: 0.1em;
}
</style>
