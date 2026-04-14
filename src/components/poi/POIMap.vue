<template>
  <div class="poi-map card">
    <h2 class="section-label">Location</h2>
    <div class="map-wrapper">
      <div ref="mapEl" class="map-frame" />
      <button class="expand-btn" aria-label="Expand map" @click="openExpanded">⤢</button>
    </div>
    <a :href="appleMapsUrl" target="_blank" rel="noopener noreferrer" class="maps-link">
      Open in Apple Maps ↗
    </a>
  </div>

  <!-- ── Expanded map dialog ───────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="map-dialog">
      <div v-if="expanded" class="map-dialog-backdrop" @click.self="closeExpanded">
        <div class="map-dialog">
          <div class="map-dialog-header">
            <span class="map-dialog-title">{{ title }}</span>
            <button class="map-dialog-close" aria-label="Close" @click="closeExpanded">✕</button>
          </div>
          <div ref="expandedMapEl" class="map-dialog-frame" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";

const MAPKIT_TOKEN = import.meta.env.VITE_MAPKIT_TOKEN;

const props = defineProps<{
  latitude: number;
  longitude: number;
  title: string;
  poiType?: number;
}>();

function cameraDistanceForType(type?: number): number {
  switch (type) {
    case 34: case 35:            // region, subregion (continent scale)
      return 20_000_000;
    case 2:                      // country
      return 4_000_000;
    case 3:                      // state
      return 1_500_000;
    case 1: case 27:             // city, cityState
      return 50_000;
    case 33:                     // district
      return 20_000;
    default:                     // landmarks, museums, parks, etc.
      return 5_000;
  }
}

const mapEl = ref<HTMLDivElement | null>(null);
const expandedMapEl = ref<HTMLDivElement | null>(null);
let mapInstance: any = null;
let expandedMapInstance: any = null;

const expanded = ref(false);

const appleMapsUrl = `https://maps.apple.com/?q=${props.latitude},${props.longitude}&ll=${props.latitude},${props.longitude}&z=5`;

function isDarkTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function loadMapKit(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).mapkit) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

function createMapInstance(el: HTMLDivElement, interactive: boolean): any {
  const mk = (window as any).mapkit;
  const center = new mk.Coordinate(props.latitude, props.longitude);

  const instance = new mk.Map(el, {
    center,
    cameraDistance: cameraDistanceForType(props.poiType),
    colorScheme: isDarkTheme() ? mk.Map.ColorSchemes.Dark : mk.Map.ColorSchemes.Light,
    showsCompass: mk.FeatureVisibility.Hidden,
    showsZoomControl: interactive,
    showsMapTypeControl: false,
    isRotationEnabled: false,
    isScrollEnabled: interactive,
    isZoomEnabled: interactive,
  });

  instance.addAnnotation(
    new mk.MarkerAnnotation(center, { title: props.title, color: "#c0622a" })
  );

  return instance;
}

async function initMap() {
  await loadMapKit();
  const mk = (window as any).mapkit;
  mk.init({ authorizationCallback: (done: (t: string) => void) => done(MAPKIT_TOKEN) });
  mapInstance = createMapInstance(mapEl.value!, false);
}

async function openExpanded() {
  expanded.value = true;
  document.body.style.overflow = "hidden";
  await nextTick();
  await loadMapKit();
  expandedMapInstance = createMapInstance(expandedMapEl.value!, true);
}

function closeExpanded() {
  expandedMapInstance?.destroy();
  expandedMapInstance = null;
  expanded.value = false;
  document.body.style.overflow = "";
}

// Re-centre preview map when props change
watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (!mapInstance) return;
    const mk = (window as any).mapkit;
    const coord = new mk.Coordinate(lat, lng);
    mapInstance.setCenterAnimated(coord);
    mapInstance.removeAnnotations(mapInstance.annotations);
    mapInstance.addAnnotation(
      new mk.MarkerAnnotation(coord, { title: props.title, color: "#c0622a" })
    );
  }
);

const themeObserver = new MutationObserver(() => {
  const mk = (window as any).mapkit;
  const scheme = isDarkTheme() ? mk.Map.ColorSchemes.Dark : mk.Map.ColorSchemes.Light;
  if (mapInstance) mapInstance.colorScheme = scheme;
  if (expandedMapInstance) expandedMapInstance.colorScheme = scheme;
});

onMounted(() => {
  initMap();
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
});

onUnmounted(() => {
  themeObserver.disconnect();
  mapInstance?.destroy();
  expandedMapInstance?.destroy();
  mapInstance = null;
  expandedMapInstance = null;
  document.body.style.overflow = "";
});
</script>

<style scoped>
.poi-map {
  margin-bottom: 1.25rem;
}

.section-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 0 0 0.85rem;
}

/* ── Preview map ───────────────────────────────────────────────────────────── */
.map-wrapper {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface-alt);
}

.map-frame {
  width: 100%;
  height: 240px;
  display: block;
}

.expand-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  color: var(--color-text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: background 0.15s, border-color 0.15s;
  z-index: 10;
}

.expand-btn:hover {
  background: var(--color-surface-alt);
  border-color: var(--color-accent);
}

.maps-link {
  display: inline-block;
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: var(--color-accent);
  text-decoration: none;
  transition: opacity 0.2s;
}

.maps-link:hover { opacity: 0.75; }

/* ── Expanded map dialog ───────────────────────────────────────────────────── */
.map-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.map-dialog {
  width: 100%;
  max-width: 900px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
}

.map-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--color-border);
}

.map-dialog-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.map-dialog-close {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}

.map-dialog-close:hover {
  color: var(--color-text);
  background: var(--color-surface-alt);
}

.map-dialog-frame {
  width: 100%;
  height: 65vh;
  display: block;
}

/* ── Transition ────────────────────────────────────────────────────────────── */
.map-dialog-enter-active,
.map-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.map-dialog-enter-active .map-dialog,
.map-dialog-leave-active .map-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.map-dialog-enter-from,
.map-dialog-leave-to {
  opacity: 0;
}

.map-dialog-enter-from .map-dialog,
.map-dialog-leave-to .map-dialog {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}

@media (max-width: 600px) {
  .map-dialog-frame { height: 55vh; }
  .map-dialog-backdrop { padding: 0.5rem; }
}
</style>
