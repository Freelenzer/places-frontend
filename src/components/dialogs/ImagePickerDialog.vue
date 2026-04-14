<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-backdrop" @mousedown.self="backdropDown = true" @mouseup="onBackdropMouseup">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">

          <!-- Header -->
          <div class="dialog-header">
            <h2 id="dialog-title" class="dialog-title">Edit photo</h2>
            <button class="close-btn" aria-label="Close" @click="$emit('cancel')">✕</button>
          </div>

          <!-- Search bar -->
          <div class="search-bar">
            <input
              ref="searchInputEl"
              class="search-input"
              type="text"
              placeholder="Search Unsplash…"
              v-model="searchQuery"
              @keydown.enter="load"
            />
            <button class="search-btn" :disabled="loading" @click="load">
              {{ loading ? '…' : '↵' }}
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="dialog-body center">
            <LoadingSpinner />
            <p class="hint">Searching Unsplash for "{{ searchQuery }}"…</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="dialog-body center">
            <ErrorState :message="error" @retry="load" />
          </div>

          <!-- Image grid -->
          <div v-else class="dialog-body">
            <p class="hint">Select a photo to use as the cover image.</p>
            <div class="image-grid">
              <button
                v-for="img in images"
                :key="img.id"
                class="image-option"
                :class="{ selected: selectedId === img.id }"
                @click="selectedId = img.id; selectedImage = img"
              >
                <img :src="img.urls.small" :alt="img.alt_description ?? title" loading="lazy" />
                <div class="image-check">✓</div>
                <div class="image-author">{{ img.user.name }}</div>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="dialog-footer">
            <button class="btn-cancel" @click="$emit('cancel')">Cancel</button>
            <button
              class="btn-save"
              :disabled="!selectedId || saving"
              @click="save"
            >
              <span v-if="saving" class="btn-spinner" />
              {{ saving ? "Saving…" : "Save photo" }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { fetchImages, updateImage } from "../../network_service.ts";
import { useBackdropClose } from "../../composables/useBackdropClose";
import LoadingSpinner from "../ui/LoadingSpinner.vue";
import ErrorState from "../ui/ErrorState.vue";

const props = defineProps<{
  open: boolean;
  // when absent (collection mode) manualSave handles the save externally
  poiId?: string | number;
  title: string;
  // when true, skip the internal updateImage call and just emit the image
  manualSave?: boolean;
}>();

const emit = defineEmits(["cancel", "saved"]);

const images = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedId = ref<string | null>(null);
const selectedImage = ref<any | null>(null);
const saving = ref(false);
const { backdropDown, onBackdropMouseup } = useBackdropClose(() => emit("cancel"));
const searchQuery = ref("");
const searchInputEl = ref<HTMLInputElement | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  selectedId.value = null;
  selectedImage.value = null;
  try {
    images.value = await fetchImages(searchQuery.value || props.title);
  } catch {
    error.value = "Could not load images. Please try again.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!selectedImage.value) return;
  saving.value = true;
  try {
    const u = selectedImage.value;
    const apiImage: APIImage = {
      imageUrl:        u.urls.full,
      previewImageUrl: u.urls.regular,
      author:          u.user.name,
      sourceUrl:       u.links.html,
      blurHash:        u.blur_hash,
      aspectRatio:     u.width / u.height,
    };
    if (!props.manualSave) {
      await updateImage(String(props.poiId), apiImage);
    }
    emit("saved", apiImage);
  } catch {
    error.value = "Could not save the image. Please try again.";
  } finally {
    saving.value = false;
  }
}

// Fetch images whenever the dialog opens
watch(() => props.open, async (val) => {
  if (val) {
    searchQuery.value = props.title;
    load();
    await nextTick();
    searchInputEl.value?.focus();
  } else {
    images.value = [];
    selectedId.value = null;
  }
});

// Trap focus & prevent body scroll while open
watch(() => props.open, (val) => {
  document.body.style.overflow = val ? "hidden" : "";
});
</script>

<style scoped>
/* ── Backdrop ───────────────────────────────────────────────────────────── */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── Dialog box ─────────────────────────────────────────────────────────── */
.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
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
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}

.close-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-alt);
}

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
  padding: 1.25rem 1.5rem;
}

.dialog-body.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  gap: 0.75rem;
}

.hint {
  font-size: 0.83rem;
  color: var(--color-text-muted);
  margin: 0 0 1rem;
}

/* ── Image grid ─────────────────────────────────────────────────────────── */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.image-option {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: 10px;
  overflow: hidden;
  border: 2.5px solid transparent;
  padding: 0;
  cursor: pointer;
  background: var(--color-surface-alt);
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.image-option:hover img {
  transform: scale(1.04);
}

.image-option:hover {
  border-color: var(--color-accent);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.image-option.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 25%, transparent);
}

/* Checkmark badge */
.image-check {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s, transform 0.15s;
}

.image-option.selected .image-check {
  opacity: 1;
  transform: scale(1);
}

/* Author overlay */
.image-author {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.3rem 0.5rem;
  font-size: 0.65rem;
  color: rgba(255,255,255,0.85);
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
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

.btn-save:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.4;
  cursor: default;
}

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

/* ── Enter/leave transitions ────────────────────────────────────────────── */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog,
.dialog-leave-active .dialog {
  transition: transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog {
  transform: scale(0.94) translateY(12px);
}

.dialog-leave-to .dialog {
  transform: scale(0.96) translateY(8px);
}
</style>
