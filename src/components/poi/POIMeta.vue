<template>
  <div class="poi-meta card">
    <div class="meta-header">
      <h2 class="section-label">Details</h2>
      <div v-if="!isPublic" class="meta-actions">
        <button class="action-btn" title="Edit details" @click="$emit('edit')">✎</button>
        <button
          class="action-btn sync-btn"
          :class="{ syncing, done }"
          :disabled="syncing"
          :title="done ? 'Done' : 'Trigger automatic data parsing'"
          @click="triggerUpdate"
        >
          <span class="sync-icon">{{ done ? '✓' : '↻' }}</span>
        </button>
      </div>
    </div>
    <ul class="meta-list">
      <li class="meta-item">
        <span class="meta-icon">📍</span>
        <div>
          <span class="meta-key">Coordinates</span>
          <span class="meta-val">{{ poi.latitude }}°, {{ poi.longitude }}°</span>
        </div>
      </li>
      <li v-if="poiTypeLabel" class="meta-item">
        <span class="meta-icon">🏷️</span>
        <div>
          <span class="meta-key">Type</span>
          <span class="meta-val">{{ poiTypeLabel }}</span>
        </div>
      </li>
      <li v-if="poi.area" class="meta-item">
        <span class="meta-icon">📐</span>
        <div>
          <span class="meta-key">Area</span>
          <span class="meta-val">{{ formattedArea }}</span>
        </div>
      </li>
    </ul>

    <div v-if="hasExternalLinks" class="external-links">
      <a
        v-if="poi.officialWebsite"
        :href="poi.officialWebsite"
        target="_blank"
        rel="noopener noreferrer"
        class="ext-link"
      >
        Website ↗
      </a>
      <a
        v-if="poi.wikiDataId"
        :href="`https://www.wikidata.org/wiki/${poi.wikiDataId}`"
        target="_blank"
        rel="noopener noreferrer"
        class="ext-link"
      >
        Wikidata ↗
      </a>
      <a
        v-if="poi.googleMapsId"
        :href="`https://www.google.com/maps?cid=${poi.googleMapsId}`"
        target="_blank"
        rel="noopener noreferrer"
        class="ext-link"
      >
        Google Maps ↗
      </a>
      <a
        v-if="poi.appleMapsId"
        :href="`https://maps.apple.com/place?auid=${poi.appleMapsId}`"
        target="_blank"
        rel="noopener noreferrer"
        class="ext-link"
      >
        Apple Maps ↗
      </a>
      <a
        v-if="poi.tripadvisorId"
        :href="`https://www.tripadvisor.com/${poi.tripadvisorId}`"
        target="_blank"
        rel="noopener noreferrer"
        class="ext-link"
      >
        TripAdvisor ↗
      </a>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { triggerPOIUpdate } from "../../network_service.ts";
import { POI_TYPE_LABELS } from "../../utils/poiTypes";
import { usePublicMode } from "../../composables/usePublicMode";

const props = defineProps<{
  poi: {
    id?: number;
    latitude: number;
    longitude: number;
    poiType?: number;
    area?: number;
    wikiDataId?: string;
    googleMapsId?: string;
    appleMapsId?: string;
    tripadvisorId?: string;
    officialWebsite?: string;
  };
}>();

defineEmits<{ edit: [] }>();

const { isPublic } = usePublicMode();

const poiTypeLabel = computed(
  () => (props.poi.poiType != null && POI_TYPE_LABELS[props.poi.poiType]) || null
);

const formattedArea = computed(() => {
  if (!props.poi.area) return null;
  return new Intl.NumberFormat(navigator.language, {
    maximumFractionDigits: 0,
  }).format(props.poi.area) + " km²";
});

const hasExternalLinks = computed(
  () => props.poi.officialWebsite || props.poi.wikiDataId || props.poi.googleMapsId
    || props.poi.appleMapsId || props.poi.tripadvisorId
);

const syncing = ref(false);
const done = ref(false);

async function triggerUpdate() {
  if (!props.poi.id) return;
  syncing.value = true;
  done.value = false;
  try {
    await triggerPOIUpdate(String(props.poi.id));
    done.value = true;
    setTimeout(() => { done.value = false; }, 3000);
  } finally {
    syncing.value = false;
  }
}
</script>

<style scoped>
.poi-meta {
  text-align: left;
}

.meta-header {
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

.meta-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.meta-icon {
  font-size: 1.1rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.meta-key {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.1rem;
}

.meta-val {
  font-size: 0.92rem;
  color: var(--color-text);
}

.external-links {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ext-link {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  transition: background 0.18s, color 0.18s;
}

.ext-link:hover {
  background: var(--color-accent);
  color: #fff;
}

/* ── Header actions ────────────────────────────────────────────────────────── */
.meta-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.action-btn:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
}

.action-btn:disabled {
  cursor: default;
}

.sync-icon {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  display: inline-block;
}

.sync-btn.syncing .sync-icon {
  animation: spin 0.9s linear infinite;
}

.sync-btn.done {
  border-color: var(--color-accent);
}

.sync-btn.done .sync-icon {
  color: var(--color-accent);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
