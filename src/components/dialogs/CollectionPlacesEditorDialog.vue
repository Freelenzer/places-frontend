<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-backdrop" @mousedown.self="backdropDown = true" @mouseup="onBackdropMouseup">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="cpe-title">

          <div class="dialog-header">
            <h2 id="cpe-title" class="dialog-title">Edit Places</h2>
            <button class="close-btn" aria-label="Close" @click="$emit('cancel')">✕</button>
          </div>

          <!-- Search -->
          <div class="search-bar">
            <input
              ref="searchInputEl"
              class="search-input"
              type="text"
              placeholder="Search places to add…"
              v-model="searchQuery"
              @keydown.enter="runSearch"
            />
            <button class="search-btn" :disabled="searching" @click="runSearch">
              {{ searching ? '…' : '↵' }}
            </button>
          </div>

          <div class="dialog-body">
            <!-- Search results -->
            <template v-if="searchResults.length">
              <h3 class="list-label">Results</h3>
              <ul class="poi-list">
                <li v-for="poi in searchResults" :key="poi.id" class="poi-row">
                  <img
                    v-if="poi.image?.previewImageUrl"
                    :src="poi.image.previewImageUrl"
                    class="poi-thumb"
                    :alt="localized(poi.titleTranslation)"
                  />
                  <div v-else class="poi-thumb poi-thumb--empty">🗺️</div>
                  <span class="poi-name">{{ localized(poi.titleTranslation) }}</span>
                  <button
                    class="row-btn row-btn--add"
                    :disabled="isAdded(poi.id)"
                    @click="addPoi(poi)"
                  >{{ isAdded(poi.id) ? '✓' : '+' }}</button>
                </li>
              </ul>
              <div class="list-divider" />
            </template>

            <!-- Current places -->
            <h3 class="list-label">
              In this collection
              <span class="list-count">{{ draftPois.length }}</span>
            </h3>

            <ul v-if="draftPois.length" class="poi-list">
              <li
                v-for="(entry, index) in draftPois"
                :key="entry.poi.id"
                class="poi-row"
                :class="{
                  'poi-row--removing': removingId === entry.poi.id,
                  'poi-row--dragging': dragIndex === index,
                  'poi-row--drag-over': dragOverIndex === index,
                }"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragover.prevent="onDragOver(index)"
                @drop.prevent="onDrop"
                @dragend="onDragEnd"
              >
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <img
                  v-if="entry.poi.image?.previewImageUrl"
                  :src="entry.poi.image.previewImageUrl"
                  class="poi-thumb"
                  :alt="localized(entry.poi.titleTranslation)"
                />
                <div v-else class="poi-thumb poi-thumb--empty">🗺️</div>
                <span class="poi-name">{{ localized(entry.poi.titleTranslation) }}</span>
                <button
                  class="row-btn row-btn--remove"
                  @click="removePoi(entry.poi.id)"
                >✕</button>
              </li>
            </ul>
            <p v-else class="empty-label">No places yet. Search above to add some.</p>
          </div>

          <div class="dialog-footer">
            <p v-if="saveError" class="save-error">{{ saveError }}</p>
            <button class="btn-cancel" :disabled="saving" @click="$emit('cancel')">Cancel</button>
            <button class="btn-save" :disabled="saving" @click="save">
              <span v-if="saving" class="btn-spinner" />
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { getPOIs, patchCollection } from "../../network_service.ts";
import { useBackdropClose } from "../../composables/useBackdropClose";
import { useDraggableList } from "../../composables/useDraggableList";
import { getLocalized } from "../../utils/localization";

const props = defineProps<{
  open: boolean;
  collection: any;
}>();

const emit = defineEmits<{
  cancel: [];
  saved: [collection: any];
}>();

const draftPois = ref<{ poi: any }[]>([]);
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const searching = ref(false);
const saving = ref(false);
const saveError = ref<string | null>(null);
const { backdropDown, onBackdropMouseup } = useBackdropClose(() => emit("cancel"));
const { dragIndex, dragOverIndex, onDragStart, onDragOver, onDrop, onDragEnd } = useDraggableList(draftPois);
const removingId = ref<number | null>(null);
const searchInputEl = ref<HTMLInputElement | null>(null);

function localized(t: Record<string, string> | null | undefined): string {
  return getLocalized(t);
}

function isAdded(poiId: number): boolean {
  return draftPois.value.some((e) => e.poi.id === poiId);
}

function addPoi(poi: any) {
  if (!isAdded(poi.id)) {
    draftPois.value = [...draftPois.value, { poi }];
  }
}

function removePoi(poiId: number) {
  removingId.value = poiId;
  setTimeout(() => {
    draftPois.value = draftPois.value.filter((e) => e.poi.id !== poiId);
    removingId.value = null;
  }, 180);
}

async function runSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  searching.value = true;
  try {
    const data = await getPOIs(q);
    searchResults.value = (data as any).items ?? data ?? [];
  } finally {
    searching.value = false;
  }
}

async function save() {
  saving.value = true;
  saveError.value = null;
  try {
    const pois = draftPois.value.map((entry: any, index: number) => ({
      id: entry.id > 0 ? entry.id : 0,
      poi: { id: entry.poi.id },
      sortOrder: index,
    }));
    const updated = { ...props.collection, pois };
    await patchCollection(updated);
    emit("saved", { ...props.collection, pois: draftPois.value });
  } catch (e) {
    saveError.value = e?.message ?? "Something went wrong.";
  } finally {
    saving.value = false;
  }
}

watch(() => props.open, async (val) => {
  if (!val) { document.body.style.overflow = ""; return; }
  document.body.style.overflow = "hidden";
  draftPois.value = [...(props.collection.pois ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  searchQuery.value = "";
  searchResults.value = [];
  await new Promise((r) => setTimeout(r, 50));
  searchInputEl.value?.focus();
});
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.dialog-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.close-btn:hover { color: var(--color-text); background: var(--color-surface-alt); }

/* ── Search bar ─────────────────────────────────────────────────────────── */
.search-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}
.search-input::placeholder { color: var(--color-text-muted); }

.search-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: var(--color-accent);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}
.search-btn:hover:not(:disabled) { opacity: 0.85; }
.search-btn:disabled { opacity: 0.4; cursor: default; }

/* ── Body ───────────────────────────────────────────────────────────────── */
.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0.25rem 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.list-count {
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.68rem;
  color: var(--color-text-muted);
  letter-spacing: 0;
}

.list-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0.5rem 0;
}

.poi-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.poi-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  background: var(--color-surface-alt);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.poi-row--removing {
  opacity: 0;
  transform: translateX(12px);
}

.poi-row--dragging {
  opacity: 0.4;
}

.poi-row--drag-over {
  border-top: 2px solid var(--color-accent);
}

.drag-handle {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--color-text-muted);
  cursor: grab;
  padding: 0 2px;
  user-select: none;
  line-height: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

.poi-thumb {
  width: 36px;
  height: 36px;
  border-radius: 7px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--color-surface);
}

.poi-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 1px solid var(--color-border);
}

.poi-name {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s;
}

.row-btn--add {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent);
}
.row-btn--add:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 25%, transparent);
}
.row-btn--add:disabled { opacity: 0.4; cursor: default; }

.row-btn--remove {
  background: color-mix(in srgb, #e53e3e 12%, transparent);
  color: #e53e3e;
}
.row-btn--remove:hover {
  background: color-mix(in srgb, #e53e3e 22%, transparent);
}

.empty-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 1rem 0;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
.save-error {
  flex: 1;
  font-size: 0.82rem;
  color: #e05252;
  margin: 0;
  align-self: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.btn-cancel {
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.btn-cancel:hover { background: var(--color-surface-alt); border-color: var(--color-text-muted); }

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-accent);
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.4rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-save:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.4; cursor: default; }

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s ease; }
.dialog-enter-active .dialog, .dialog-leave-active .dialog {
  transition: transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.2s ease;
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog { transform: scale(0.94) translateY(12px); }
.dialog-leave-to .dialog { transform: scale(0.96) translateY(8px); }
</style>
