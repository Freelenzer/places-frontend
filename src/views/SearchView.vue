<template>
  <div class="search-view">

    <!-- ── Top bar ──────────────────────────────────────────────────────────── -->
    <header class="top-bar">
      <span class="app-wordmark">Places</span>
      <div class="top-bar-actions">
        <button v-if="!isPublic" class="create-btn" aria-label="Create new place" @click="showCreate = true">+</button>
        <ThemeToggle />
      </div>
    </header>

    <CreatePOIDialog v-if="!isPublic" :open="showCreate" :initial-query="showCreate ? lastQuery : undefined" @cancel="showCreate = false" @created="showCreate = false" />

    <!-- ── Hero / Search section ────────────────────────────────────────────── -->
    <section class="hero-section">
      <h1 class="hero-title">
        Discover the<br />world's places
      </h1>
      <p class="hero-subtitle">
        Search countries, regions, cities and landmarks
      </p>

      <div class="search-row">
        <SearchBar
          v-model="query"
          :loading="loading"
          placeholder='Try "Egypt", "Tokyo", "Alps"…'
          @search="runSearch"
          @clear="onClear"
        />
        <button class="search-btn" :disabled="!query.trim() || loading" @click="runSearch()">
          Search
        </button>
      </div>

      <div class="type-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeType === 'places' }"
          @click="setType('places')"
        >Places</button>
        <button
          class="toggle-btn"
          :class="{ active: activeType === 'collections' }"
          @click="setType('collections')"
        >Collections</button>
      </div>
    </section>

    <!-- ── Results ───────────────────────────────────────────────────────────── -->
    <main class="results-section" v-if="hasSearched">
      <div class="results-meta" v-if="!loading">
        <span v-if="results.length">
          {{ totalItems }}
          {{ activeType === 'collections' ? `collection${totalItems !== 1 ? 's' : ''}` : `place${totalItems !== 1 ? 's' : ''}` }}
          found for <em>"{{ lastQuery }}"</em>
        </span>
        <span v-else class="no-results-label">
          No {{ activeType === 'collections' ? 'collections' : 'places' }} found for <em>"{{ lastQuery }}"</em>
        </span>
      </div>

      <!-- Loading skeletons -->
      <div v-if="loading" class="results-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card" />
      </div>

      <!-- Error -->
      <ErrorState v-else-if="error" :message="error" @retry="runSearch(currentPage)" />

      <!-- Result cards -->
      <div v-else-if="results.length" class="results-grid">
        <template v-if="activeType === 'collections'">
          <CollectionCard v-for="c in results" :key="c.id" :collection="c" />
        </template>
        <template v-else>
          <POICard v-for="poi in results" :key="poi.id" :poi="poi" />
        </template>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <span class="empty-icon">🔍</span>
        <p>Try a different search term or check your spelling.</p>
        <button v-if="!isPublic" class="create-place-btn" @click="showCreate = true">+ Create "{{ lastQuery }}"</button>
      </div>

      <!-- Pagination -->
      <nav v-if="!loading && totalPages > 1" class="pagination" aria-label="Search results pages">
        <button
          class="page-btn page-btn--arrow"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          @click="goToPage(currentPage - 1)"
        >‹</button>

        <template v-for="p in totalPages" :key="p">
          <!-- Gap before last page -->
          <span
            v-if="(p === totalPages && currentPage < totalPages - 2 && totalPages > 6)"
            class="page-gap"
          >…</span>
          <!-- Show page button if within window -->
          <button
            v-if="p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1 || (currentPage <= 3 && p <= 4) || (currentPage >= totalPages - 2 && p >= totalPages - 3)"
            class="page-btn"
            :class="{ 'page-btn--active': p === currentPage }"
            :aria-current="p === currentPage ? 'page' : undefined"
            @click="goToPage(p)"
          >{{ p }}</button>
          <!-- Gap after first page -->
          <span
            v-if="(p === 1 && currentPage > 3 && totalPages > 6)"
            class="page-gap"
          >…</span>
        </template>

        <button
          class="page-btn page-btn--arrow"
          :disabled="currentPage === totalPages"
          aria-label="Next page"
          @click="goToPage(currentPage + 1)"
        >›</button>
      </nav>
    </main>

    <!-- ── Landing suggestions (before first search) ─────────────────────────── -->
    <div v-else class="suggestions">
      <button
        v-for="s in suggestions"
        :key="s"
        class="suggestion-chip"
        @click="applySuggestion(s)"
      >
        {{ s }}
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPOIs, searchCollections } from "../network_service.ts";
import { useTheme } from "../composables/useTheme";
import { usePublicMode } from "../composables/usePublicMode";

import ThemeToggle from "../components/ui/ThemeToggle.vue";
import SearchBar from "../components/ui/SearchBar.vue";
import POICard from "../components/poi/POICard.vue";
import CollectionCard from "../components/collection/CollectionCard.vue";
import ErrorState from "../components/ui/ErrorState.vue";
import CreatePOIDialog from "../components/dialogs/CreatePOIDialog.vue";

useTheme();
const { isPublic } = usePublicMode();

const showCreate = ref(false);

const route = useRoute();
const router = useRouter();

const PER_PAGE = 10;

const query = ref((route.query.q as string) ?? "");
const lastQuery = ref("");
const results = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const hasSearched = ref(false);
const activeType = ref<"places" | "collections">(
  route.query.type === "collections" ? "collections" : "places"
);
const currentPage = ref(Number(route.query.page) || 1);
const totalPages = ref(0);
const totalItems = ref(0);

const suggestions = ["Egypt", "Japan", "Alps", "Amazon", "New York", "Sahara"];

async function runSearch(page = 1) {
  const q = query.value.trim();
  if (!q) return;

  loading.value = true;
  error.value = null;
  hasSearched.value = true;
  lastQuery.value = q;
  currentPage.value = page;

  router.replace({ query: { q, type: activeType.value, page: page > 1 ? String(page) : undefined } });

  try {
    const data = activeType.value === "collections"
      ? await searchCollections(q, page, PER_PAGE)
      : await getPOIs(q, page, PER_PAGE);
    results.value = data.items ?? [];
    totalItems.value = data.metadata?.total ?? results.value.length;
    const per = data.metadata?.per ?? PER_PAGE;
    totalPages.value = Math.ceil(totalItems.value / per);
  } catch {
    error.value = "Something went wrong. Please try again.";
    results.value = [];
    totalPages.value = 0;
  } finally {
    loading.value = false;
  }
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  runSearch(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setType(type: "places" | "collections") {
  if (activeType.value === type) return;
  activeType.value = type;
  results.value = [];
  hasSearched.value = false;
  totalPages.value = 0;
  router.replace({ query: { q: query.value || undefined, type } });
  if (query.value.trim()) runSearch(1);
}

function onClear() {
  results.value = [];
  hasSearched.value = false;
  totalPages.value = 0;
  router.replace({ query: { type: activeType.value } });
}

function applySuggestion(s: string) {
  query.value = s;
  runSearch(1);
}

// Run immediately if a query is already in the URL
onMounted(() => {
  if (query.value) runSearch(currentPage.value);
});
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.app-wordmark {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-accent);
  font-size: 1.35rem;
  line-height: 1;
  font-weight: 300;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s;
}

.create-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
  transform: rotate(90deg) scale(1.08);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-accent) 35%, transparent);
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4rem 1.5rem 3rem;
  gap: 1rem;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--color-text);
  margin: 0;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 660px;
  margin-top: 0.5rem;
}

.search-btn {
  flex-shrink: 0;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 0 1.6rem;
  height: 54px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.search-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.search-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* ── Type toggle ──────────────────────────────────────────────────────────── */
.type-toggle {
  display: flex;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}

.toggle-btn {
  padding: 0.4rem 1.25rem;
  border-radius: 999px;
  border: none;
  background: none;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.toggle-btn.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.toggle-btn:not(.active):hover {
  color: var(--color-text-secondary);
}

/* ── Suggestions ──────────────────────────────────────────────────────────── */
.suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  padding: 0 1.5rem 4rem;
}

.suggestion-chip {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, transform 0.15s;
}

.suggestion-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-2px);
}

/* ── Results ──────────────────────────────────────────────────────────────── */
.results-section {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
  box-sizing: border-box;
}

.results-meta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.results-meta em {
  color: var(--color-text-secondary);
  font-style: normal;
  font-weight: 600;
}

.results-grid {
  display: grid;
  /* 200px min lets two cards fit side-by-side on a 420px phone */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

/* ── Skeletons ────────────────────────────────────────────────────────────── */
.skeleton-card {
  height: 260px;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    var(--color-surface-alt) 25%,
    var(--color-surface) 50%,
    var(--color-surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 0;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 2.5rem;
}

.create-place-btn {
  margin-top: 0.25rem;
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-accent);
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, transform 0.15s;
}

.create-place-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

/* ── Pagination ───────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.page-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.page-btn--arrow {
  font-size: 1.1rem;
  line-height: 1;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.page-gap {
  width: 28px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  line-height: 36px;
  user-select: none;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .hero-section {
    padding: 2rem 1rem 1.5rem;
    gap: 0.75rem;
  }

  .hero-title {
    font-size: clamp(1.8rem, 8vw, 2.4rem);
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-btn {
    width: 100%;
    height: 48px;
  }

  .top-bar {
    padding: 0.85rem 1rem;
  }

  .results-section {
    padding: 0 0.75rem 3rem;
  }

  /* Single column on very small phones */
  .results-grid {
    grid-template-columns: 1fr;
  }

  .suggestions {
    padding: 0 1rem 3rem;
    gap: 0.5rem;
  }
}

/* Two columns on mid-size phones (landscape or larger phones) */
@media (min-width: 420px) and (max-width: 600px) {
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
