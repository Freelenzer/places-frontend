<template>
  <div class="poi-detail-view">
    <div v-if="loading" class="state-container">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="state-container">
      <ErrorState :message="error" @retry="fetchPOI" />
    </div>

    <template v-else-if="poi">
      <POIHero
        :image="heroImage"
        :title="localizedTitle"
        @edit-image="imagePickerOpen = true"
        @edit-title="titleEditorOpen = true"
      />

      <main class="detail-content">
        <div class="content-grid">
          <section class="description-section">
            <POIDescription
              :text="localizedDescription"
              @edit="descEditorOpen = true"
            />
            <POICollections :poi="poi" />
          </section>

          <aside class="sidebar">
            <POIMap
              :latitude="poi.latitude"
              :longitude="poi.longitude"
              :title="localizedTitle"
              :poi-type="poi.poiType"
            />
            <POIMeta :poi="poi" @edit="metaEditorOpen = true" />
          </aside>
        </div>
      </main>

      <ImagePickerDialog
        :open="imagePickerOpen"
        :poi-id="poi.id"
        :title="localizedTitle"
        @cancel="imagePickerOpen = false"
        @saved="onImageSaved"
      />

      <TranslationEditorDialog
        :open="titleEditorOpen"
        field="title"
        :poi="poi"
        @cancel="titleEditorOpen = false"
        @saved="onPOISaved"
      />

      <TranslationEditorDialog
        :open="descEditorOpen"
        field="description"
        :poi="poi"
        @cancel="descEditorOpen = false"
        @saved="onPOISaved"
      />

      <POIMetaEditorDialog
        :open="metaEditorOpen"
        :poi="poi"
        @cancel="metaEditorOpen = false"
        @saved="onPOISaved"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { getPOIBy } from "../network_service.ts";
import { getLocalized } from "../utils/localization.ts";
import { useTheme } from "../composables/useTheme";

import POIHero from "../components/poi/POIHero.vue";
import POIDescription from "../components/poi/POIDescription.vue";
import POICollections from "../components/poi/POICollections.vue";
import POIMap from "../components/poi/POIMap.vue";
import POIMeta from "../components/poi/POIMeta.vue";
import ImagePickerDialog from "../components/dialogs/ImagePickerDialog.vue";
import TranslationEditorDialog from "../components/dialogs/TranslationEditorDialog.vue";
import POIMetaEditorDialog from "../components/dialogs/POIMetaEditorDialog.vue";
import LoadingSpinner from "../components/ui/LoadingSpinner.vue";
import ErrorState from "../components/ui/ErrorState.vue";

useTheme();

const route = useRoute();
const poi = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const imagePickerOpen  = ref(false);
const titleEditorOpen  = ref(false);
const descEditorOpen   = ref(false);
const metaEditorOpen   = ref(false);

const imageCacheBust = ref(Date.now());
const heroImage = computed(() => {
  const img = poi.value?.image;
  if (!img) return null;
  const bust = `?v=${imageCacheBust.value}`;
  return {
    ...img,
    imageUrl:        img.imageUrl        ? img.imageUrl        + bust : undefined,
    previewImageUrl: img.previewImageUrl ? img.previewImageUrl + bust : undefined,
  };
});

const localizedTitle = computed(() =>
  poi.value ? getLocalized(poi.value.titleTranslation) : ""
);

const localizedDescription = computed(() =>
  poi.value ? getLocalized(poi.value.descriptionTranslation) : ""
);

const previousTitle = document.title;
watch(localizedTitle, (title) => {
  document.title = title ? `${title} — Places` : "Places";
});
onUnmounted(() => { document.title = previousTitle; });

function onImageSaved(image) {
  poi.value = { ...poi.value, image };
  imageCacheBust.value = Date.now();
  imagePickerOpen.value = false;
}

function onPOISaved(updatedPOI: any) {
  poi.value = updatedPOI;
  titleEditorOpen.value  = false;
  descEditorOpen.value   = false;
  metaEditorOpen.value   = false;
}

async function fetchPOI() {
  loading.value = true;
  error.value = null;
  poi.value = null;
  window.scrollTo({ top: 0 });
  try {
    poi.value = await getPOIBy(route.query.id as string);
    imageCacheBust.value = Date.now();
  } catch {
    error.value = "Failed to load this place. Please try again.";
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query.id,
  (id, prevId) => { if (id !== prevId) fetchPOI(); }
);

onMounted(fetchPOI);
</script>

<style scoped>
.poi-detail-view {
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
  padding: 1.5rem 1rem 4rem;
  box-sizing: border-box;
}

.description-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Two-column on wide screens, single column on mobile ────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
}

/* Sidebar stacks below description on narrow screens */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}

/* Single column on small phones */
@media (max-width: 500px) {
  .sidebar {
    grid-template-columns: 1fr;
  }

  .detail-content {
    padding: 1rem 0.75rem 3rem;
  }
}
</style>
