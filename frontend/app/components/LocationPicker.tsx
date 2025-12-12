"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import type {
  Coordinate,
  LocationPickerValue,
  StructuredLocation,
} from "../types/location";
import {
  hasMapboxToken,
  normalizeMapboxFeature,
  searchMapboxPlaces,
  type MapboxFeature,
} from "../lib/mapbox";

type LocationPickerProps = {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  disabled?: boolean;
  placeholder?: string;
  inputId?: string;
  minimumQueryLength?: number;
  debounceMs?: number;
  autocompleteEnabled?: boolean;
  className?: string;
  proximity?: Coordinate | null;
};

type Suggestion = {
  id: string;
  primary: string;
  secondary?: string;
  structured: StructuredLocation;
};

const DEFAULT_MIN_QUERY = 2;
const DEFAULT_DEBOUNCE_MS = 250;

export function LocationPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Search for a place or venue",
  inputId,
  minimumQueryLength = DEFAULT_MIN_QUERY,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  autocompleteEnabled = true,
  className,
  proximity,
}: LocationPickerProps) {
  const tokenAvailable = hasMapboxToken();
  const isAutocompleteActive = tokenAvailable && autocompleteEnabled;
  const [query, setQuery] = useState(value.freeform ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFeatureDisabled = disabled || !isAutocompleteActive;

  const hasSelection = Boolean(value.structured);
  const showSuggestions =
    !isFeatureDisabled &&
    suggestions.length > 0 &&
    query.length >= minimumQueryLength;

  useEffect(() => {
    setQuery(
      value.freeform ??
        value.structured?.address ??
        value.structured?.name ??
        "",
    );
  }, [value.freeform, value.structured]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const fetchSuggestions = useCallback(
    async (nextQuery: string) => {
      if (nextQuery.trim().length < minimumQueryLength) {
        clearSuggestions();
        return;
      }

      if (abortController.current) {
        abortController.current.abort();
      }

      const controller = new AbortController();
      abortController.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const features = await searchMapboxPlaces(nextQuery, {
          limit: 5,
          signal: controller.signal,
          proximity: proximity
            ? [proximity.longitude, proximity.latitude]
            : undefined,
        });
        const mapped = features.map(convertFeatureToSuggestion);
        setSuggestions(mapped);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Mapbox search failed", err);
        setError("Unable to fetch places. Try again in a moment.");
      } finally {
        setIsLoading(false);
      }
    },
    [clearSuggestions, minimumQueryLength, proximity],
  );

  const handleQueryChange = useCallback(
    (nextValue: string) => {
      setQuery(nextValue);
      onChange({
        freeform: nextValue,
        structured: undefined,
      });

      if (isFeatureDisabled) {
        return;
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(nextValue);
      }, debounceMs);
    },
    [debounceMs, fetchSuggestions, isFeatureDisabled, onChange],
  );

  const handleSelect = useCallback(
    (suggestion: Suggestion) => {
      clearSuggestions();
      setQuery(suggestion.secondary ?? suggestion.primary);
      onChange({
        freeform: suggestion.secondary ?? suggestion.primary,
        structured: suggestion.structured,
      });
    },
    [clearSuggestions, onChange],
  );

  const handleBlur = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const handleClear = useCallback(() => {
    clearSuggestions();
    setQuery("");
    onChange({ freeform: "", structured: undefined });
  }, [clearSuggestions, onChange]);

  const helperText = useMemo(() => {
    if (!autocompleteEnabled) {
      return "Location search disabled. You can still type anything in the field.";
    }
    if (!tokenAvailable) {
      return "Map search unavailable. You can still type anything in the field.";
    }
    if (error) {
      return error;
    }
    if (hasSelection) {
      return "Location captured with coordinates.";
    }
    return undefined;
  }, [autocompleteEnabled, error, hasSelection, tokenAvailable]);

  return (
    <div className={clsx("space-y-2", className)}>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            "w-full border-b-2 bg-transparent py-2 pr-14 text-xl md:text-2xl text-gray-900 placeholder-gray-400 focus:outline-none transition-colors",
            disabled
              ? "border-gray-200 text-gray-400"
              : "border-gray-300 focus:border-gray-900",
          )}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        )}
        {isLoading && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            Searching…
          </div>
        )}
      </div>

      {helperText && (
        <p
          className={clsx(
            "text-sm",
            disabled || !autocompleteEnabled
              ? "text-gray-500"
              : error || !tokenAvailable
                ? "text-red-600"
                : "text-green-600",
          )}
        >
          {helperText}
        </p>
      )}

      {showSuggestions && (
        <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 shadow-lg bg-white">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                <p className="text-base font-medium text-gray-900">
                  {suggestion.primary}
                </p>
                {suggestion.secondary && (
                  <p className="text-sm text-gray-500">
                    {suggestion.secondary}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function convertFeatureToSuggestion(feature: MapboxFeature): Suggestion {
  const structured = normalizeMapboxFeature(feature);

  return {
    id: feature.id,
    primary: structured.name,
    secondary: structured.address,
    structured,
  };
}
