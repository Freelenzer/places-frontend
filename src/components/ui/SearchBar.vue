<template>
  <div class="search-bar-wrapper">
    <div class="search-bar" :class="{ 'is-focused': focused, 'is-loading': loading }">
      <span class="search-icon">
        <!-- Spinner while loading, magnifier otherwise -->
        <svg v-if="loading" class="spinner" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
            stroke-dasharray="28" stroke-dashoffset="10" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" />
        </svg>
      </span>

      <input
        ref="inputRef"
        class="search-input"
        type="search"
        :placeholder="placeholder"
        :value="modelValue"
        autocomplete="off"
        spellcheck="false"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false"
        @keydown.enter="$emit('search')"
        @keydown.escape="clear"
      />

      <button
        v-if="modelValue"
        class="clear-btn"
        aria-label="Clear search"
        @click="clear"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  modelValue: string;
  loading?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [];
  clear: [];
}>();

const focused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function clear() {
  emit("update:modelValue", "");
  emit("clear");
  inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<style scoped>
.search-bar-wrapper {
  width: 100%;
  max-width: 580px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  padding: 0 1.25rem;
  height: 54px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-bar.is-focused {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

/* ── Icon / Spinner ─────────────────────────────────────────────────────────── */
.search-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--color-text-muted);
  width: 20px;
  height: 20px;
}

.search-icon svg {
  width: 20px;
  height: 20px;
}

.spinner {
  animation: spin 0.75s linear infinite;
  color: var(--color-accent);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Input ──────────────────────────────────────────────────────────────────── */
.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-text);
  min-width: 0;
  /* Hide browser default clear button */
  -webkit-appearance: none;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

/* ── Clear button ───────────────────────────────────────────────────────────── */
.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  padding: 0.25rem;
  border-radius: 50%;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.clear-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-alt);
}
</style>
