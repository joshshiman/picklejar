"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useToast } from "../../../components/ToastProvider";
import { LocationPicker } from "../../../components/LocationPicker";
import type {
  Coordinate,
  LocationPickerValue,
  MapBounds,
} from "../../../types/location";

type SuggestionFormData = {
  title: string;
  description?: string;
  location?: string;
};

type SuggestionRequestPayload = SuggestionFormData & {
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

type SuggestionCoordinatesPayload = {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
};

export default function SuggestPage() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SuggestionFormData>({
    defaultValues: {
      location: "",
    },
  });
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const structuredLocationEnabled =
    process.env.NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION === "true";

  const [locationValue, setLocationValue] = useState<LocationPickerValue>({
    freeform: "",
  });
  const [suggestionCoords, setSuggestionCoords] = useState<Coordinate[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    register("location");
  }, [register]);

  useEffect(() => {
    const queryId = searchParams.get("member_id");
    if (queryId) {
      setMemberId(queryId);
      return;
    }
    const storedId = localStorage.getItem(`pj_member_${id}`);
    if (storedId) {
      setMemberId(storedId);
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (!structuredLocationEnabled) {
      setSuggestionCoords([]);
      return;
    }

    let cancelled = false;

    const fetchSuggestionCoords = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggestions`,
        );
        const payload = (
          Array.isArray(res.data) ? res.data : []
        ) as SuggestionCoordinatesPayload[];
        const normalized = payload
          .map((suggestion) => {
            if (
              typeof suggestion.latitude === "number" &&
              typeof suggestion.longitude === "number"
            ) {
              return {
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
              };
            }
            const parsed = parseLocationToLatLng(suggestion.location);
            if (!parsed) return null;
            return { latitude: parsed[0], longitude: parsed[1] };
          })
          .filter((coord): coord is Coordinate => Boolean(coord));

        if (!cancelled) {
          setSuggestionCoords(normalized);
        }
      } catch (error) {
        console.error(
          "Failed to derive proximity from existing suggestions:",
          error,
        );
      }
    };

    fetchSuggestionCoords();

    return () => {
      cancelled = true;
    };
  }, [id, structuredLocationEnabled]);

  const jarProximity = useMemo<Coordinate | null>(() => {
    if (!structuredLocationEnabled || !suggestionCoords.length) {
      return null;
    }

    const totals = suggestionCoords.reduce(
      (acc, coord) => {
        acc.latitude += coord.latitude;
        acc.longitude += coord.longitude;
        return acc;
      },
      { latitude: 0, longitude: 0 },
    );

    return {
      latitude: totals.latitude / suggestionCoords.length,
      longitude: totals.longitude / suggestionCoords.length,
    };
  }, [structuredLocationEnabled, suggestionCoords]);

  const handleLocationChange = (next: LocationPickerValue) => {
    setLocationValue(next);
    setValue("location", next.freeform ?? "", { shouldDirty: true });
  };

  const onSubmit = async (data: SuggestionFormData) => {
    if (!memberId) {
      addToast("You must join the PickleJar first.", "error");
      router.push(`/jar/${id}`);
      return;
    }

    try {
      const payload = buildSuggestionPayload(
        data,
        locationValue,
        structuredLocationEnabled,
      );

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggest?member_id=${memberId}`,
        payload,
      );
      router.push(`/jar/${id}`);
    } catch (error) {
      console.error("Failed to add this pickle:", error);
      addToast("Failed to add this pickle. Please try again.", "error");
    }
  };

  const baseFieldClasses =
    "w-full border-b-2 border-gray-200 bg-transparent py-3 text-2xl md:text-3xl text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors";

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-900 flex flex-col justify-center">
      <div className="mx-auto max-w-2xl w-full">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push(`/jar/${id}`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to the jar
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          {/* Question 1 */}
          <div className="space-y-4">
            <label
              htmlFor="title"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              1. What pickle are you adding?{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Thai Food, Bowling, Board Game Café, Restuarant"
              {...register("title", { required: "Pickle name is required" })}
              className={baseFieldClasses}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-600 bg-red-50 inline-block px-2 py-1 rounded">
                ⚠️ {errors.title.message}
              </p>
            )}
          </div>

          {/* Question 2 */}
          <div className="space-y-4">
            <label
              htmlFor="description"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              2. Any pickle details?{" "}
              <span className="text-lg text-gray-400 font-normal">
                (Optional)
              </span>
            </label>
            <p className="text-sm text-gray-500">
              Share the why, any links, or constraints so people can evaluate it
              quickly.
            </p>
            <textarea
              id="description"
              placeholder="Links, context, reasoning for this pickle..."
              {...register("description")}
              className={`${baseFieldClasses} resize-none`}
              rows={1}
              style={{ minHeight: "3rem" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Question 3 */}
          <div className="space-y-4">
            <label
              htmlFor="location"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              3. Where does this pickle happen?{" "}
              <span className="text-lg text-gray-400 font-normal">
                (Optional)
              </span>
            </label>
            <p className="text-sm text-gray-500">
              {structuredLocationEnabled
                ? "Search for a place or type it manually so we can drop a pin on the map."
                : "Drop the neighborhood, venue, or link so everyone knows where to meet or book."}
            </p>
            <LocationPicker
              value={locationValue}
              onChange={handleLocationChange}
              autocompleteEnabled={structuredLocationEnabled}
              inputId="location"
              placeholder={
                structuredLocationEnabled
                  ? "Enter any location address"
                  : "Type any neighborhood, venue, or link"
              }
              proximity={jarProximity}
            />
          </div>

          <div className="pt-8">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all"
            >
              Add Pickle ↵
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function parseLocationToLatLng(
  location?: string | null,
): [number, number] | null {
  if (!location) return null;
  const parts = location.split(",").map((part) => part.trim());
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function buildSuggestionPayload(
  data: SuggestionFormData,
  locationValue: LocationPickerValue,
  structuredLocationEnabled: boolean,
): SuggestionRequestPayload {
  const payload: SuggestionRequestPayload = { ...data };
  const freeform = locationValue.freeform?.trim() ?? "";

  if (freeform) {
    payload.location = freeform;
  }

  if (structuredLocationEnabled && locationValue.structured) {
    const structured = locationValue.structured;
    payload.location =
      payload.location ?? structured.address ?? structured.name;

    payload.structured_location = {
      name: structured.name,
      address: structured.address,
      place_id: structured.placeId,
      provider: structured.provider,
      map_bounds: structured.mapBounds,
      location_confidence: structured.locationConfidence,
      location_last_verified_at: structured.lastVerifiedAt,
      raw: structured.raw,
    };

    payload.latitude = structured.latitude;
    payload.longitude = structured.longitude;
    payload.map_bounds = structured.mapBounds;
    payload.geo_source = structured.provider;
    payload.location_confidence = structured.locationConfidence;
    payload.location_last_verified_at = structured.lastVerifiedAt;
  }

  return payload;
}
