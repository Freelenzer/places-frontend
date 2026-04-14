<template>
  <article class="poi-collections card">
    <h2 class="section-label">Collections</h2>

    <div v-if="loading" class="spinner-wrapper">
      <LoadingSpinner />
    </div>

    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="fetchCollections"
    />

    <template v-else-if="collections.length">
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="collection-group"
      >
        <!-- Clickable group header -->
        <RouterLink class="group-header" :to="{ path: '/collection', query: { id: collection.id } }">
          <span class="group-title">{{ localized(collection.titleTranslation) }}</span>
          <span class="group-cta">{{ collection.pois.length }} places →</span>
        </RouterLink>

        <!-- POI thumbnail strip -->
        <div class="poi-strip">
          <RouterLink
            v-for="item in visiblePois(collection)"
            :key="item.poi.id"
            class="poi-thumb-btn"
            :to="{ path: '/poi', query: { id: item.poi.id } }"
          >
            <div class="poi-thumb-wrapper">
              <img
                v-if="item.poi.image?.previewImageUrl"
                :src="item.poi.image.previewImageUrl"
                :alt="localized(item.poi.titleTranslation)"
                class="poi-thumb"
                loading="lazy"
              />
              <div v-else class="poi-thumb-placeholder">
                <span class="placeholder-icon">🗺️</span>
              </div>
            </div>
            <span class="poi-thumb-label">{{ localized(item.poi.titleTranslation) }}</span>
          </RouterLink>

          <!-- Show all tile (only when there are more than 4 POIs) -->
          <RouterLink
            v-if="collection.pois.length > 4"
            class="poi-thumb-btn"
            :to="{ path: '/collection', query: { id: collection.id } }"
          >
            <div class="poi-thumb-wrapper show-all-thumb">
              <span class="show-all-count">+{{ collection.pois.length - 3 }}</span>
            </div>
            <span class="poi-thumb-label">Show all</span>
          </RouterLink>
        </div>
      </div>
    </template>

    <p v-else class="empty-label">No collections found.</p>
  </article>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getCollections } from "../../network_service.ts";
import { getLocalized } from "../../utils/localization";
import LoadingSpinner from "../ui/LoadingSpinner.vue";
import ErrorState from "../ui/ErrorState.vue";

const props = defineProps<{ poi: any }>();

const collections = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function localized(translation: Record<string, string> | null | undefined): string {
  return getLocalized(translation);
}

/** Show first 3 items when total > 4 (4th slot becomes "show all"), else show up to 4. */
function visiblePois(collection: any): any[] {
  const sorted = [...collection.pois].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.length > 4 ? sorted.slice(0, 3) : sorted.slice(0, 4);
}

async function fetchCollections() {
  loading.value = true;
  error.value = null;
  try {
    collections.value = await getCollections(props.poi);
  } catch {
    error.value = "Failed to load collections.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchCollections);
</script>

<style scoped>
.poi-collections {
  text-align: left;
}

.section-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0 0 1rem;
}

/* ── Loading / empty ───────────────────────────────────────────────────────── */
.spinner-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.empty-label {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* ── Collection group ──────────────────────────────────────────────────────── */
.collection-group + .collection-group {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* ── Clickable group header ────────────────────────────────────────────────── */
.group-header {
  text-decoration: none;
  color: inherit;
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  margin-bottom: 0.85rem;
  transition: opacity 0.15s;
}

.group-header:hover {
  opacity: 0.75;
}

.group-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-cta {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-accent);
  letter-spacing: 0.03em;
  transition: letter-spacing 0.18s;
}

.group-header:hover .group-cta {
  letter-spacing: 0.08em;
}

/* ── POI thumbnail strip ───────────────────────────────────────────────────── */
.poi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}

.poi-thumb-btn {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  min-width: 0;
}

.poi-thumb-wrapper {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  transition: border-color 0.18s, transform 0.18s;
}

.poi-thumb-btn:hover .poi-thumb-wrapper {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.poi-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.poi-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 1.4rem;
  opacity: 0.35;
}

/* ── Show all tile ─────────────────────────────────────────────────────────── */
.show-all-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-alt);
}

.show-all-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent);
}

/* ── Thumb label ───────────────────────────────────────────────────────────── */
.poi-thumb-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ── Mobile ────────────────────────────────────────────────────────────────── */
@media (max-width: 500px) {
  .poi-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .poi-thumb-label {
    font-size: 0.65rem;
  }
}
</style>
