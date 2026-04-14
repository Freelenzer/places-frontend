<template>
  <div class="error-state" role="alert">
    <span class="error-icon">⚠️</span>
    <p class="error-message">{{ message }}</p>
    <button class="retry-btn" @click="$emit('retry')">Try again</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
defineEmits<{ retry: [] }>();
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 2.5rem;
}

.error-message {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 320px;
}

.retry-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.retry-btn:hover {
  opacity: 0.85;
}
</style>
