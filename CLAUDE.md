# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Serve the dist/ build locally
```

No linter or test suite is configured.

## API Configuration

The app talks to a backend REST API. The host is controlled by `VITE_API_HOST`:

- **`.env`** sets the production default: `http://178.104.63.42:8080`
- **`.env.local`** (gitignored) overrides it locally. Use `VITE_API_HOST=/api` to route through the Vite dev proxy (avoids CORS), or a full URL to hit a server directly.

The Vite dev proxy rewrites `/api/*` → `http://127.0.0.1:8080/*`.

## Architecture

### Layers

```
Views (pages)  →  Components  →  network_service.ts  →  REST API / Wikidata / Unsplash
                       ↕
                  Composables
```

All API calls go through **`src/network_service.ts`** — a single file with typed wrappers around `fetch`. Two clients exist: `api` (own backend) and `unsplashRequest` (Unsplash). New endpoints belong here.

### Routes → Views

| Route | View | Purpose |
|---|---|---|
| `/` | `SearchView` | Paginated POI + Collection search |
| `/poi?poiId=` | `POIDetailView` | Full POI editor |
| `/collection?id=` | `CollectionDetailView` | Collection editor with draggable place list |
| `/regions` | `RegionOverviewView` | Browse regions / countries |

### Data Model (`src/types.ts`)

- **`APIPOI`** — a Place of Interest with coordinates, external IDs (Wikidata, Google Maps, Apple Maps, Tripadvisor), a `poiType` number, and `APITranslation` objects for title and description.
- **`APICollection`** — a named list of `APICollectionPlace` entries, each wrapping an `APIPOI` with a `sortOrder` and optional per-place translation overrides.
- **`APITranslation`** — 12-language string map (english, german, french, spanish, portuguese, dutch, persian, chinese, japanese, korean, croatian, turkish).

### Theming

Theme is toggled via `data-theme="light|dark"` on `<html>`, managed by `src/composables/useTheme.ts` (persists to `localStorage`). CSS custom properties are defined in two places:

- **`src/styles/design-tokens.css`** — canonical token definitions (use these for new components)
- **`src/App.vue` `<style>`** — duplicates some tokens; exists for historical reasons

The canonical palette: warm cream/terracotta for light, dark brown for dark. Accent is `--color-accent` (`#c0622a` light / `#e07a46` dark).

### Key Utilities

- **`src/utils/localization.ts`** — `getLocalized(translation)` picks the right language string based on `navigator.language`, falling back to English then any non-empty value.
- **`src/utils/poiTypes.ts`** — `POI_TYPE_LABELS` maps the `poiType` integer (1–50) to a human-readable label.
- **`src/composables/useDraggableList.ts`** — drag-to-reorder logic used in `CollectionDetailView` for sorting `CollectionPlace` entries.
- **`src/composables/useBackdropClose.ts`** — click-outside-to-close behaviour shared by all dialogs.
