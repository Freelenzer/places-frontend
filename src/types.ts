// ─── Translation ───────────────────────────────────────────────────────────────

export interface APITranslation {
  id?: number;
  english?: string;
  german?: string;
  french?: string;
  spanish?: string;
  portuguese?: string;
  dutch?: string;
  persian?: string;
  chinese?: string;
  japanese?: string;
  korean?: string;
  croatian?: string;
  turkish?: string;
}

// ─── Image ─────────────────────────────────────────────────────────────────────

export interface APIImage {
  id?: number;
  imageUrl?: string;
  previewImageUrl?: string;
  author?: string;
  sourceUrl?: string;
  blurHash?: string;
  aspectRatio?: number;
}

// ─── POI ───────────────────────────────────────────────────────────────────────

export interface APIPOI {
  id: number;
  titleTranslation?: APITranslation;
  descriptionTranslation?: APITranslation;
  image?: APIImage | null;
  latitude?: number;
  longitude?: number;
  area?: number;
  poiType?: number;
  wikiDataId?: string;
  googleMapsId?: string;
  appleMapsId?: string;
  tripadvisorId?: string;
  officialWebsite?: string;
  countryId?: number;
}

// ─── Collection ────────────────────────────────────────────────────────────────

export interface APICollectionPlace {
  id: number;
  poi: APIPOI;
  titleTranslation?: APITranslation;
  descriptionTranslation?: APITranslation;
  image?: APIImage | null;
  sortOrder: number;
}

export interface APICollection {
  id: number;
  titleTranslation: APITranslation;
  descriptionTranslation?: APITranslation;
  pois: APICollectionPlace[];
  image?: APIImage | null;
}
