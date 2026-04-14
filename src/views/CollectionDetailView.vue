<template>
  <div class="collection-detail-view">
    <div v-if="loading" class="state-container">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="state-container">
      <ErrorState :message="error" @retry="fetchCollection" />
    </div>

    <template v-else-if="collection">
      <POIHero
        :image="heroImage"
        :title="localizedTitle"
        @edit-image="imagePickerOpen = true"
        @edit-title="titleEditorOpen = true"
      />

      <main class="detail-content">
        <POIDescription
          v-if="localizedDescription"
          :text="localizedDescription"
          @edit="descEditorOpen = true"
        />

        <!-- Places section -->
        <section class="places-section">
          <div class="section-header">
            <h2 class="section-label">Places</h2>
          </div>

          <CollectionMap v-if="pois.length" :pois="pois" />

          <div v-if="sortedPois.length" class="results-grid">
            <div
              v-for="entry in sortedPois"
              :key="entry.poi.id"
              class="place-card-wrapper"
            >
              <POICard :poi="effectivePoi(entry)" />
            </div>
          </div>
          <p v-else class="empty-label">No places in this collection.</p>
        </section>
      </main>

      <ImagePickerDialog
        :open="imagePickerOpen"
        :title="localizedTitle"
        :manual-save="true"
        @cancel="imagePickerOpen = false"
        @saved="onImageSaved"
      />

      <TranslationEditorDialog
        :open="titleEditorOpen"
        field="title"
        :poi="collection"
        :save-fn="saveCollection"
        @cancel="titleEditorOpen = false"
        @saved="onCollectionSaved"
      />

      <TranslationEditorDialog
        :open="descEditorOpen"
        field="description"
        :poi="collection"
        :save-fn="saveCollection"
        @cancel="descEditorOpen = false"
        @saved="onCollectionSaved"
      />

      <CollectionPlacesEditorDialog
        :open="placesEditorOpen"
        :collection="collection"
        @cancel="placesEditorOpen = false"
        @saved="onPlacesSaved"
      />

      <CollectionPlaceTranslationDialog
        v-if="editingEntry"
        :open="placeTranslationOpen"
        :entry="editingEntry"
        @cancel="placeTranslationOpen = false"
        @saved="onPlaceEntrySaved"
      />

      <ImagePickerDialog
        v-if="editingEntry"
        :open="poiImagePickerOpen"
        :manual-save="true"
        :title="getLocalized(editingEntry.poi.titleTranslation ?? null)"
        @cancel="poiImagePickerOpen = false"
        @saved="onPoiImageSaved"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "../composables/useTheme";
import { getLocalized } from "../utils/localization";
import { getCollectionBy, patchCollection, patchCollectionPOI } from "../network_service.ts";

import POIHero from "../components/poi/POIHero.vue";
import POIDescription from "../components/poi/POIDescription.vue";
import POICard from "../components/poi/POICard.vue";
import CollectionMap from "../components/collection/CollectionMap.vue";
import ImagePickerDialog from "../components/dialogs/ImagePickerDialog.vue";
import TranslationEditorDialog from "../components/dialogs/TranslationEditorDialog.vue";
import CollectionPlacesEditorDialog from "../components/dialogs/CollectionPlacesEditorDialog.vue";
import CollectionPlaceTranslationDialog from "../components/dialogs/CollectionPlaceTranslationDialog.vue";
import LoadingSpinner from "../components/ui/LoadingSpinner.vue";
import ErrorState from "../components/ui/ErrorState.vue";

useTheme();

const route = useRoute();

const collection = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const imagePickerOpen        = ref(false);
const titleEditorOpen        = ref(false);
const descEditorOpen         = ref(false);
const placesEditorOpen       = ref(false);
const placeTranslationOpen   = ref(false);
const poiImagePickerOpen     = ref(false);
const editingEntry           = ref<any>(null);

const imageCacheBust = ref(Date.now());

const heroImage = computed(() => {
  const img = collection.value?.image;
  if (!img) return null;
  const bust = `?v=${imageCacheBust.value}`;
  return {
    ...img,
    imageUrl:        img.imageUrl        ? img.imageUrl        + bust : undefined,
    previewImageUrl: img.previewImageUrl ? img.previewImageUrl + bust : undefined,
  };
});

const localizedTitle = computed(() =>
  getLocalized(collection.value?.titleTranslation ?? null)
);

const localizedDescription = computed(() =>
  getLocalized(collection.value?.descriptionTranslation ?? null)
);

const sortedPois = computed(() =>
  [...(collection.value?.pois ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
);

const pois = computed(() => sortedPois.value.map((entry) => entry.poi));

const previousTitle = document.title;
watch(localizedTitle, (t) => {
  document.title = t ? `${t} — Places` : "Places";
});
onUnmounted(() => { document.title = previousTitle; });

/** Returns the poi with collection-specific title/description overrides when present. */
function effectivePoi(entry) {
  function hasContent(t) {
    return t && Object.keys(t).some(k => k !== "id" && t[k]);
  }
  return {
    ...entry.poi,
    titleTranslation:       hasContent(entry.titleTranslation)       ? entry.titleTranslation       : entry.poi.titleTranslation,
    descriptionTranslation: hasContent(entry.descriptionTranslation) ? entry.descriptionTranslation : entry.poi.descriptionTranslation,
    image:                  entry.image?.imageUrl                    ? entry.image                  : entry.poi.image,
  };
}

/** Minimal payload the server needs — avoids sending bloated nested poi objects. */
function collectionPayload(c, overrides = {}) {
  return {
    id: c.id,
    titleTranslation: c.titleTranslation,
    descriptionTranslation: c.descriptionTranslation,
    image: c.image,
    pois: (c.pois ?? []).map((e) => ({
      id: e.id > 0 ? e.id : 0,
      poi: { id: e.poi?.id ?? e.poiId },
      titleTranslation: e.titleTranslation ?? null,
      descriptionTranslation: e.descriptionTranslation ?? null,
    })),
    ...overrides,
  };
}

async function saveCollection(updated) {
  await patchCollection(collectionPayload(updated));
}

function onImageSaved(image) {
  collection.value = { ...collection.value, image };
  imageCacheBust.value = Date.now();
  imagePickerOpen.value = false;
  patchCollection(collectionPayload(collection.value));
}

async function onPoiImageSaved(image) {
  poiImagePickerOpen.value = false;
  const updatedEntry = { ...editingEntry.value, image };
  const updatedPois = collection.value.pois.map((e) =>
    e.poi.id === updatedEntry.poi.id ? updatedEntry : e
  );
  collection.value = { ...collection.value, pois: updatedPois };
  editingEntry.value = null;
  await patchCollectionPOI(updatedEntry);
}

function onPlaceEntrySaved(updatedEntry) {
  placeTranslationOpen.value = false;
  editingEntry.value = null;
  const updatedPois = collection.value.pois.map((e) =>
    e.poi.id === updatedEntry.poi.id ? updatedEntry : e
  );
  collection.value = { ...collection.value, pois: updatedPois };
}

function onPlacesSaved(updated) {
  placesEditorOpen.value = false;
  collection.value = updated;
}

function onCollectionSaved(updated) {
  collection.value = updated;
  titleEditorOpen.value = false;
  descEditorOpen.value  = false;
}

async function fetchCollection() {
  loading.value = true;
  error.value = null;
  try {
    collection.value = await getCollectionBy(String(route.query.id));
    imageCacheBust.value = Date.now();
  } catch {
    error.value = "Failed to load this collection. Please try again.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchCollection);
</script>

<style scoped>
.collection-detail-view {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Places section ────────────────────────────────────────────────────────── */
.places-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.edit-link {
  background: none;
  border: none;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.edit-link:hover {
  color: var(--color-accent);
  background: var(--color-surface-alt);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.place-card-wrapper {
  position: relative;
}

.place-edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  z-index: 1;
}

.place-card-wrapper:hover .place-edit-btn {
  opacity: 1;
}

.place-edit-btn--image {
  top: 44px;
}

[data-theme="dark"] .place-edit-btn {
  background: rgba(0,0,0,0.6);
}

.empty-label {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin: 0;
}

@media (max-width: 600px) {
  .detail-content { padding: 1.25rem 0.75rem 3rem; }
  .results-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
