<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-backdrop" @mousedown.self="backdropDown = true" @mouseup="onBackdropMouseup">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="med-title">

          <div class="dialog-header">
            <h2 id="med-title" class="dialog-title">Edit Details</h2>
            <button class="close-btn" aria-label="Close" @click="$emit('cancel')">✕</button>
          </div>

          <div class="dialog-body">
            <div class="field-group">
              <h3 class="group-label">Location</h3>
              <div class="fields-row">
                <div class="field">
                  <label class="field-label">Latitude</label>
                  <input class="field-input" type="number" step="any" v-model.number="draft.latitude" />
                </div>
                <div class="field">
                  <label class="field-label">Longitude</label>
                  <input class="field-input" type="number" step="any" v-model.number="draft.longitude" />
                </div>
                <div class="field">
                  <label class="field-label">Area (km²)</label>
                  <input class="field-input" type="number" step="any" placeholder="Optional" v-model.number="draft.area" />
                </div>
              </div>
            </div>

            <div class="field-group">
              <h3 class="group-label">Classification</h3>
              <div class="field">
                <label class="field-label">Type</label>
                <select class="field-input" v-model.number="draft.poiType">
                  <option :value="undefined">— None —</option>
                  <option v-for="(label, id) in POI_TYPE_LABELS" :key="id" :value="Number(id)">
                    {{ label }} ({{ id }})
                  </option>
                </select>
              </div>
            </div>

            <div class="field-group">
              <h3 class="group-label">External IDs &amp; Links</h3>
              <div class="fields-col">
                <div class="field">
                  <label class="field-label">Official Website</label>
                  <input class="field-input" type="url" placeholder="https://…" v-model="draft.officialWebsite" />
                </div>
                <div class="field">
                  <label class="field-label">Wikidata ID</label>
                  <input class="field-input" type="text" placeholder="Q123456" v-model="draft.wikiDataId" />
                </div>
                <div class="field">
                  <label class="field-label">Google Maps ID</label>
                  <input class="field-input" type="text" placeholder="1234567890" v-model="draft.googleMapsId" />
                </div>
                <div class="field">
                  <label class="field-label">Apple Maps ID</label>
                  <input class="field-input" type="text" placeholder="1234567890" v-model="draft.appleMapsId" />
                </div>
                <div class="field">
                  <label class="field-label">TripAdvisor ID</label>
                  <input class="field-input" type="text" placeholder="g187400" v-model="draft.tripadvisorId" />
                </div>
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
import { useBackdropClose } from "../../composables/useBackdropClose";
import { patchPOI } from "../../network_service.ts";
import { POI_TYPE_LABELS } from "../../utils/poiTypes";

const props = defineProps<{
  open: boolean;
  poi: any;
}>();

const emit = defineEmits<{
  cancel: [];
  saved: [poi: any];
}>();

const saving = ref(false);
const { backdropDown, onBackdropMouseup } = useBackdropClose(() => emit("cancel"));

const draft = ref<{
  latitude: number;
  longitude: number;
  area?: number;
  poiType?: number;
  wikiDataId?: string;
  googleMapsId?: string;
  appleMapsId?: string;
  tripadvisorId?: string;
  officialWebsite?: string;
}>({ latitude: 0, longitude: 0 });

watch(() => props.open, (val) => {
  if (!val) { document.body.style.overflow = ""; return; }
  document.body.style.overflow = "hidden";
  draft.value = {
    latitude:        props.poi.latitude,
    longitude:       props.poi.longitude,
    area:            props.poi.area,
    poiType:         props.poi.poiType,
    wikiDataId:      props.poi.wikiDataId,
    googleMapsId:    props.poi.googleMapsId,
    appleMapsId:     props.poi.appleMapsId,
    tripadvisorId:   props.poi.tripadvisorId,
    officialWebsite: props.poi.officialWebsite,
  };
});

async function save() {
  saving.value = true;
  try {
    const updatedPOI = { ...props.poi, ...draft.value };
    await patchPOI(updatedPOI);
    emit("saved", updatedPOI);
  } catch {
    emit("cancel");
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
  max-width: 560px;
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

.fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.fields-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.field-input {
  width: 100%;
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

select.field-input { cursor: pointer; }

@media (max-width: 480px) {
  .fields-row { grid-template-columns: 1fr 1fr; }
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
