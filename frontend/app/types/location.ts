export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type MapBounds = {
  northeast: Coordinate;
  southwest: Coordinate;
};

export type LocationMetadata = {
  /** Canonical display name (e.g., venue or neighborhood). */
  name: string;
  /** Full address or provider-formatted place label. */
  address?: string;
  /** Provider-specific identifier (Mapbox feature id, Google place_id, etc.). */
  placeId?: string;
  /** Provider slug (e.g., "mapbox", "google"). */
  provider?: string;
  /** Optional bounding box used to fit map viewport (NE/SW pairs). */
  mapBounds?: MapBounds;
  /** Optional confidence score (0-100) if supplied by the provider. */
  locationConfidence?: number;
  /** ISO timestamp for future revalidation flows. */
  lastVerifiedAt?: string;
  /** Raw provider payload for auditing/debugging. */
  raw?: Record<string, unknown>;
};

export type StructuredLocation = LocationMetadata & Coordinate;

export type LocationPickerValue = {
  structured?: StructuredLocation;
  /** Raw human-entered fallback string preserved for display/logging. */
  freeform?: string;
};

export type StructuredLocationPayload = {
  structured_location?: {
    name: string;
    address?: string;
    place_id?: string;
    provider?: string;
    map_bounds?: MapBounds;
    location_confidence?: number;
    location_last_verified_at?: string;
    raw?: Record<string, unknown>;
  };
  latitude?: number;
  longitude?: number;
  map_bounds?: MapBounds;
  geo_source?: string;
  location_confidence?: number;
  location_last_verified_at?: string;
};

export type SuggestionLocationPayload = StructuredLocationPayload & {
  location?: string;
};

export type NormalizedLocationSelection = {
  picker: LocationPickerValue;
  payload: SuggestionLocationPayload;
};
