// ─── Configuration ────────────────────────────────────────────────────────────

// Set VITE_API_HOST in .env.local to switch APIs locally (file is gitignored).
// Use "/api" to route through the Vite dev proxy (avoids CORS), or a full URL to hit a server directly.
const API_HOST: string = (import.meta as any).env.VITE_API_HOST || "http://localhost:8080";

const UNSPLASH_CLIENT_ID = (import.meta as any).env.VITE_UNSPLASH_CLIENT_ID as string;
const UNSPLASH_BASE = "https://api.unsplash.com";

// ─── Types ─────────────────────────────────────────────────────────────────────

import type { APIImage } from "./types.ts";
export type { APIImage };

// ─── Core fetch clients ────────────────────────────────────────────────────────

/**
 * Base options applied to every request against our own API.
 * Change headers, mode, credentials etc. here — one place, all calls inherit it.
 */
const BASE_OPTIONS: RequestInit = {};

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Accept": "application/json",
};

/**
 * Thin wrapper around fetch for our own API.
 * Builds the URL, merges options, parses JSON and throws on non-2xx responses.
 */
async function apiRequest<T>(
  path: string,
  params?: Record<string, string>,
  options: RequestInit = {}
): Promise<T> {
  const base = API_HOST.startsWith("http")
    ? API_HOST
    : window.location.origin + API_HOST;
  // Concatenate directly so the proxy prefix (/api) is preserved.
  const url = new URL(base.replace(/\/$/, "") + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const hasBody = options.method && options.method !== "GET" && options.method !== "HEAD";
  const headers = hasBody ? JSON_HEADERS : {};
  const response = await fetch(url.toString(), { ...BASE_OPTIONS, ...options, headers });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${body ? `: ${body}` : ""}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * Convenience wrappers for each HTTP verb.
 */
const api = {
  get:   <T>(path: string, params?: Record<string, string>) =>
    apiRequest<T>(path, params, { method: "GET" }),

  post:  <T>(path: string, body: unknown, params?: Record<string, string>) =>
    apiRequest<T>(path, params, { method: "POST", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown, params?: Record<string, string>) =>
    apiRequest<T>(path, params, { method: "PATCH", body: JSON.stringify(body) }),

  put:   <T>(path: string, body: unknown, params?: Record<string, string>) =>
    apiRequest<T>(path, params, { method: "PUT", body: JSON.stringify(body) }),
};

/**
 * Separate client for Unsplash — different base URL and auth mechanism.
 */
async function unsplashRequest<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(path, UNSPLASH_BASE);
  url.searchParams.set("client_id", UNSPLASH_CLIENT_ID);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), { method: "GET", mode: "cors" });

  if (!response.ok) {
    throw new Error(`Unsplash error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── POI endpoints ─────────────────────────────────────────────────────────────

export interface IPageMeta {
  page: number;
  per: number;
  total: number;
  pageCount: number;
}

export interface IPage<T> {
  items: T[];
  metadata: IPageMeta;
}

export async function getPOIs(query: string, page = 1, per = 20): Promise<IPage<any>> {
  return api.get<IPage<any>>("/pois", {
    name: query.toLocaleLowerCase(),
    page: String(page),
    per: String(per),
  });
}

export async function getPOIBy(poiId: string): Promise<any> {
  return api.get<any>("/poi", { poiId: poiId });
}

export async function patchPOI(poi: any): Promise<any> {
  return api.patch<any>("/poi", poi, { poiId: String(poi.id) });
}

export async function triggerPOIUpdate(poiId: string): Promise<void> {
  await api.post<any>("/updatepoi", {}, { poiId });
}

export async function updateImage(poiId: string, image: APIImage): Promise<any> {
  return api.post<any>("/image", image, { poiId: String(poiId) });
}

// ─── Lookup / list endpoints ───────────────────────────────────────────────────

export async function getRegions(): Promise<any[]> {
  const data = await api.get<{ results: any[] }>("/regions");
  return data.results;
}

export async function getSubregions(): Promise<any[]> {
  const data = await api.get<{ results: any[] }>("/subregions");
  return data.results;
}

export async function getCountries(): Promise<any[]> {
  const data = await api.get<{ results: any[] }>("/countries");
  return data.results;
}

export async function getStates(countryId = "22"): Promise<any[]> {
  const data = await api.get<{ results: any[] }>("/states", { countryId });
  return data.results;
}

export async function getCollections(poi: any): Promise<any[]> {
  const data = await api.get<{ items: any[] }>("/collections", {
    poiId: String(poi.id),
  });
  return data.items;
}

export async function searchCollections(name: string, page = 1, per = 20): Promise<IPage<any>> {
  return api.get<IPage<any>>("/collections", {
    name,
    page: String(page),
    per: String(per),
  });
}

export async function getCollectionBy(collectionId: string): Promise<any> {
  return api.get<any>("/collection", { id: collectionId });
}

export async function patchCollection(collection: any): Promise<any> {
  return api.post<any>("/collection", collection);
}

export async function patchCollectionPOI(entry: any): Promise<any> {
  return api.put<any>("/collectionpoi", entry);
}

// ─── Wikidata ──────────────────────────────────────────────────────────────────

export async function searchWikidata(query: string): Promise<any[]> {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "5");
  url.searchParams.set("origin", "*");
  const response = await fetch(url.toString(), { method: "GET" });
  if (!response.ok) throw new Error(`Wikidata error ${response.status}`);
  const data = await response.json();
  return data.search ?? [];
}

export async function createPOI(wikiDataId: string): Promise<any> {
  return api.post<any>("/createpoi", {}, { wikiDataId });
}

// ─── Unsplash ──────────────────────────────────────────────────────────────────

export async function fetchImages(text: string): Promise<any[]> {
  const data = await unsplashRequest<{ results: any[] }>("/search/photos", {
    query: text,
    per_page: "20",
  });
  return data.results;
}