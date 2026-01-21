import type {
  MapBounds,
  StructuredLocation,
  SuggestionLocationPayload,
} from "../types/location";

const MAPBOX_GEOCODING_URL =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

type MapboxCoordinates = [longitude: number, latitude: number];
type MapboxBbox = [west: number, south: number, east: number, north: number];

export type MapboxFeature = {
  id: string;
  type: "Feature";
  text: string;
  place_name: string;
  place_type: string[];
  relevance?: number;
  geometry: {
    type: "Point";
    coordinates: MapboxCoordinates;
    bbox?: MapboxBbox;
  };
  bbox?: MapboxBbox;
  properties?: Record<string, unknown>;
  context?: Array<{ id: string; text: string }>;
};

export type MapboxGeocodingResponse = {
  type: "FeatureCollection";
  query: string[];
  features: MapboxFeature[];
  attribution?: string;
};

export type MapboxSearchOptions = {
  proximity?: MapboxCoordinates;
  types?: string;
  limit?: number;
  sessionToken?: string;
  language?: string;
  signal?: AbortSignal;
};

const DEFAULT_LIMIT = 5;

function getMapboxToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error(
      "NEXT_PUBLIC_MAPBOX_TOKEN is not set. Add it to your frontend environment before enabling the location picker.",
    );
  }
  return token;
}

export function hasMapboxToken(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
}

export async function searchMapboxPlaces(
  query: string,
  options: MapboxSearchOptions = {},
): Promise<MapboxFeature[]> {
  if (!query.trim()) {
    return [];
  }

  const token = getMapboxToken();
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    limit: String(options.limit ?? DEFAULT_LIMIT),
    language: options.language ?? "en",
  });

  if (options.proximity) {
    const [lng, lat] = options.proximity;
    params.set("proximity", `${lng},${lat}`);
  }

  if (options.types) {
    params.set("types", options.types);
  }

  if (options.sessionToken) {
    params.set("session_token", options.sessionToken);
  }

  const url = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(query)}.json?${params.toString()}`;
  const response = await fetch(url, {
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Mapbox Places request failed (${response.status}): ${body || response.statusText}`,
    );
  }

  const data = (await response.json()) as MapboxGeocodingResponse;
  return data.features ?? [];
}

export function normalizeMapboxFeature(
  feature: MapboxFeature,
): StructuredLocation {
  const [longitude, latitude] = feature.geometry.coordinates;
  const mapBounds = bboxToBounds(feature.bbox ?? feature.geometry.bbox);

  return {
    name: feature.text,
    address: feature.place_name,
    placeId: feature.id,
    provider: "mapbox",
    latitude,
    longitude,
    mapBounds,
    locationConfidence: normalizeRelevance(feature.relevance),
    lastVerifiedAt: new Date().toISOString(),
    raw: feature,
  };
}

export function buildSuggestionLocationPayload(
  feature: MapboxFeature,
): SuggestionLocationPayload {
  const structured = normalizeMapboxFeature(feature);

  return {
    location: structured.address ?? structured.name,
    structured_location: {
      name: structured.name,
      address: structured.address,
      place_id: structured.placeId,
      provider: structured.provider,
      map_bounds: structured.mapBounds,
      location_confidence: structured.locationConfidence,
      location_last_verified_at: structured.lastVerifiedAt,
      raw: structured.raw,
    },
    latitude: structured.latitude,
    longitude: structured.longitude,
    map_bounds: structured.mapBounds,
    geo_source: structured.provider,
    location_confidence: structured.locationConfidence,
    location_last_verified_at: structured.lastVerifiedAt,
  };
}

function bboxToBounds(bbox?: MapboxBbox): MapBounds | undefined {
  if (!bbox) return undefined;

  const [west, south, east, north] = bbox;
  return {
    southwest: { latitude: south, longitude: west },
    northeast: { latitude: north, longitude: east },
  };
}

function normalizeRelevance(relevance?: number): number | undefined {
  if (typeof relevance !== "number") {
    return undefined;
  }
  return Math.max(0, Math.min(100, Math.round(relevance * 100)));
}
