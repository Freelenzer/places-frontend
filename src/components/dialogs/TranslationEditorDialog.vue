<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-backdrop" @mousedown.self="backdropDown = true" @mouseup="onBackdropMouseup">
        <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="'ted-title-' + field">

          <div class="dialog-header">
            <h2 :id="'ted-title-' + field" class="dialog-title">
              Edit {{ field === 'title' ? 'title' : 'description' }}
            </h2>
            <button class="close-btn" aria-label="Close" @click="$emit('cancel')">✕</button>
          </div>

          <div class="dialog-body">
            <div class="hint-row">
              <p class="hint">
                Fill in translations below. Unsaved fields keep their current value.
              </p>
              <button
                v-if="field === 'description'"
                class="expand-btn"
                :title="expanded ? 'Compact view' : 'Expand textareas'"
                @click="expanded = !expanded"
              >{{ expanded ? '⊟' : '⊞' }}</button>
            </div>

            <!-- 3-column grid of language fields -->
            <div class="lang-grid" :class="{ 'lang-grid--expanded': expanded }">
              <div v-for="lang in LANGUAGES" :key="lang.key" class="lang-field">
                <label class="lang-label">
                  <span class="lang-flag">{{ lang.flag }}</span>
                  {{ lang.label }}
                </label>
                <textarea
                  v-if="field === 'description'"
                  class="lang-input"
                  :class="{ 'lang-input--expanded': expanded }"
                  :placeholder="`${lang.label} description…`"
                  v-model="draft[lang.key]"
                  rows="4"
                />
                <input
                  v-else
                  class="lang-input"
                  type="text"
                  :placeholder="`${lang.label} title…`"
                  v-model="draft[lang.key]"
                />
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-cancel" @click="$emit('cancel')">Cancel</button>
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
import { patchPOI } from "../../network_service.ts";
import { useBackdropClose } from "../../composables/useBackdropClose";

const LANGUAGES = [
  { key: "english",    label: "English",    flag: "🇬🇧" },
  { key: "german",     label: "German",     flag: "🇩🇪" },
  { key: "french",     label: "French",     flag: "🇫🇷" },
  { key: "spanish",    label: "Spanish",    flag: "🇪🇸" },
  { key: "portuguese", label: "Portuguese", flag: "🇵🇹" },
  { key: "dutch",      label: "Dutch",      flag: "🇳🇱" },
  { key: "persian",    label: "Persian",    flag: "🇮🇷" },
  { key: "chinese",    label: "Chinese",    flag: "🇨🇳" },
  { key: "japanese",   label: "Japanese",   flag: "🇯🇵" },
  { key: "korean",     label: "Korean",     flag: "🇰🇷" },
  { key: "croatian",   label: "Croatian",   flag: "🇭🇷" },
] as const;

type LangKey = typeof LANGUAGES[number]["key"];

const props = defineProps<{
  open: boolean;
  field: "title" | "description";
  poi: any;
  // optional override — when provided, called instead of patchPOI
  saveFn?: (updated: any) => Promise<any>;
}>();

const emit = defineEmits<{
  cancel: [];
  saved: [poi: any];
}>();

const draft = ref<Record<string, string>>({});
const saving = ref(false);
const { backdropDown, onBackdropMouseup } = useBackdropClose(() => emit("cancel"));
const expanded = ref(false);

// Populate draft from the current POI whenever the dialog opens
watch(() => props.open, (val) => {
  if (!val) return;
  const source = props.field === "title"
    ? props.poi.titleTranslation
    : props.poi.descriptionTranslation;
  draft.value = { ...source };
  document.body.style.overflow = "hidden";
}, { immediate: false });

watch(() => props.open, (val) => {
  if (!val) document.body.style.overflow = "";
});

async function save() {
  saving.value = true;
  try {
    const translationKey = props.field === "title"
      ? "titleTranslation"
      : "descriptionTranslation";

    const updatedPOI = {
      ...props.poi,
      [translationKey]: {
        ...props.poi[translationKey],
        ...draft.value,
      },
    };

    if (props.saveFn) {
      await props.saveFn(updatedPOI);
    } else {
      await patchPOI(updatedPOI);
    }
    emit("saved", updatedPOI);
  } catch {
    emit("cancel");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* ── Backdrop / dialog shell — mirrors ImagePickerDialog ─────────────────── */
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
  max-width: 780px;
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
  text-transform: capitalize;
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

/* ── Body ───────────────────────────────────────────────────────────────── */
.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
}

.hint-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.hint {
  font-size: 0.83rem;
  color: var(--color-text-muted);
  margin: 0;
  text-align: left;
}

.expand-btn {
  flex-shrink: 0;
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  width: 26px;
  height: 26px;
  font-size: 1rem;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, color 0.15s;
}

.expand-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* ── 3-column language grid ─────────────────────────────────────────────── */
.lang-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem 1.25rem;
}

@media (max-width: 600px) {
  .lang-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 400px) {
  .lang-grid { grid-template-columns: 1fr; }
}

.lang-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}

.lang-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.lang-flag { font-size: 1rem; }

.lang-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--color-text);
  resize: vertical;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.lang-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.lang-input::placeholder { color: var(--color-text-muted); }

/* textarea-specific: cap at ~3 visual lines but stay resizable */
textarea.lang-input {
  min-height: calc(0.88rem * 1.5 * 3 + 1.1rem); /* 3 lines + padding */
  max-height: calc(0.88rem * 1.5 * 3 + 1.1rem);
  line-height: 1.5;
  overflow-y: auto;
}

/* Expanded mode: single column, tall textareas */
.lang-grid--expanded {
  grid-template-columns: 1fr;
}

textarea.lang-input--expanded {
  min-height: 8rem;
  max-height: none;
  cursor: se-resize;
}

textarea.lang-input--expanded:focus {
  cursor: text;
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

/* ── Transition ─────────────────────────────────────────────────────────── */
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s ease; }
.dialog-enter-active .dialog, .dialog-leave-active .dialog {
  transition: transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.2s ease;
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog { transform: scale(0.94) translateY(12px); }
.dialog-leave-to .dialog { transform: scale(0.96) translateY(8px); }
</style>
