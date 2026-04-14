<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-backdrop" @mousedown.self="backdropDown = true" @mouseup="onBackdropMouseup">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="cpoi-title">

          <div class="dialog-header">
            <h2 id="cpoi-title" class="dialog-title">Create Place</h2>
            <button class="close-btn" aria-label="Close" @click="$emit('cancel')">✕</button>
          </div>

          <div class="dialog-body">
            <div class="field-group">
              <h3 class="group-label">Search Wikidata</h3>
              <div class="search-row">
                <input
                  ref="inputRef"
                  class="field-input"
                  type="text"
                  placeholder='e.g. "Santorini", "Amazon"…'
                  v-model="searchQuery"
                  @keydown.enter="search"
                />
                <button class="btn-search" :disabled="!searchQuery.trim() || searching" @click="search">
                  <span v-if="searching" class="btn-spinner" />
                  <span v-else>Search</span>
                </button>
              </div>
              <p v-if="searchError" class="error-text">{{ searchError }}</p>
            </div>

            <div v-if="results.length" class="field-group">
              <h3 class="group-label">Select a result</h3>
              <ul class="results-list">
                <li
                  v-for="item in results"
                  :key="item.id"
                  class="result-item"
                  :class="{ selected: selected?.id === item.id }"
                  @click="selected = item"
                >
                  <div class="result-main">
                    <span class="result-label">{{ item.label }}</span>
                    <span class="result-id">{{ item.id }}</span>
                  </div>
                  <p v-if="item.description" class="result-desc">{{ item.description }}</p>
                </li>
              </ul>
            </div>

            <div v-else-if="hasSearched && !searching" class="no-results">
              No results found. Try a different name.
            </div>
          </div>

          <div class="dialog-footer">
            <p v-if="createError" class="create-error">{{ createError }}</p>
            <button class="btn-cancel" :disabled="saving" @click="$emit('cancel')">Cancel</button>
            <button class="btn-save" :disabled="!selected || saving" @click="create">
              <span v-if="saving" class="btn-spinner" />
              {{ saving ? 'Creating…' : 'Create' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useBackdropClose } from "../../composables/useBackdropClose";
import { searchWikidata, createPOI } from "../../network_service.ts";

const props = defineProps<{ open: boolean; initialQuery?: string }>();

const emit = defineEmits<{
  cancel: [];
  created: [];
}>();

const router = useRouter();
const { backdropDown, onBackdropMouseup } = useBackdropClose(() => { if (!saving.value) emit("cancel"); });

const inputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");
const results = ref<any[]>([]);
const selected = ref<any | null>(null);
const searching = ref(false);
const saving = ref(false);
const searchError = ref<string | null>(null);
const createError = ref<string | null>(null);
const hasSearched = ref(false);

watch(() => props.open, async (val) => {
  document.body.style.overflow = val ? "hidden" : "";
  if (!val) {
    searchQuery.value = "";
    results.value = [];
    selected.value = null;
    searchError.value = null;
    createError.value = null;
    hasSearched.value = false;
  } else {
    await nextTick();
    if (props.initialQuery) {
      searchQuery.value = props.initialQuery;
      search();
    } else {
      inputRef.value?.focus();
    }
  }
});

async function search() {
  const q = searchQuery.value.trim();
  if (!q) return;
  searching.value = true;
  searchError.value = null;
  selected.value = null;
  hasSearched.value = true;
  try {
    results.value = await searchWikidata(q);
  } catch {
    searchError.value = "Search failed. Please try again.";
    results.value = [];
  } finally {
    searching.value = false;
  }
}

async function create() {
  if (!selected.value) return;
  saving.value = true;
  createError.value = null;
  try {
    const poi = await createPOI(selected.value.id);
    emit("created");
    router.push({ path: "/poi", query: { id: poi.id } });
  } catch {
    createError.value = "Something went wrong. Please try again.";
  } finally {
    saving.value = false;
  }
}
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

.close-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-alt);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0;
}

.search-row {
  display: flex;
  gap: 0.5rem;
}

.field-input {
  flex: 1;
  box-sizing: border-box;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.field-input::placeholder { color: var(--color-text-muted); }

.btn-search {
  flex-shrink: 0;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: border-color 0.2s, color 0.2s;
}

.btn-search:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-search:disabled { opacity: 0.4; cursor: default; }

.error-text {
  font-size: 0.82rem;
  color: #e05252;
  margin: 0;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.result-item {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-alt);
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
}

.result-item:hover {
  border-color: var(--color-accent);
}

.result-item.selected {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-alt));
}

.result-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.result-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}

.result-id {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

.result-desc {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.no-results {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 1rem 0;
}

.create-error {
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

.btn-cancel:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-text-muted);
}

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
