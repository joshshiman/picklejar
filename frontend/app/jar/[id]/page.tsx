"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { Edit2, Circle, Check, Copy } from "lucide-react";
import {
  MapContainer,
  CircleMarker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L, { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { useToast } from "../../components/ToastProvider";

type PickleJarStatus =
  | "setup"
  | "suggesting"
  | "voting"
  | "completed"
  | "cancelled";

interface PickleJar {
  id: string;
  title: string;
  description?: string | null;
  status: PickleJarStatus | string;
  suggestion_deadline?: string | null;
  voting_deadline?: string | null;
  points_per_voter?: number;
  creator_phone?: string | null;
}

interface Member {
  id: string;
  display_name: string | null;
  has_suggested: boolean;
  has_voted: boolean;
}

interface Suggestion {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  structured_location?: Record<string, unknown> | null;
  latitude?: number | null;
  longitude?: number | null;
  map_bounds?: SuggestionMapBounds | null;
}

type SuggestionMapBounds = {
  northeast: {
    latitude: number;
    longitude: number;
  };
  southwest: {
    latitude: number;
    longitude: number;
  };
};

interface Result {
  suggestion_id: string;
  title: string;
  description: string | null;
  total_points: number;
  is_winner: boolean;
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1600&q=80",
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const normalizePhone = (value?: string | null) =>
  value ? value.replace(/[^+\d]/g, "") : "";

const extractDigits = (value: string) => value.replace(/\D/g, "").slice(0, 10);

const formatPhoneForInput = (value: string) => {
  const digits = extractDigits(value);
  if (!digits) return "";
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6);
  if (digits.length < 3) return `(${digits}`;
  if (digits.length === 3) return `(${area})`;
  if (digits.length < 7) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${line}`;
};

const DEFAULT_CENTER: LatLngExpression = [43.6532, -79.3832];

if (typeof window !== "undefined") {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
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

function getSuggestionCoordinates(
  suggestion: Suggestion,
): [number, number] | null {
  if (
    typeof suggestion.latitude === "number" &&
    typeof suggestion.longitude === "number"
  ) {
    return [suggestion.latitude, suggestion.longitude];
  }
  return parseLocationToLatLng(suggestion.location);
}

function getSuggestionAddress(suggestion: Suggestion): string | undefined {
  if (
    suggestion.structured_location &&
    typeof suggestion.structured_location === "object" &&
    "address" in suggestion.structured_location
  ) {
    const structured = suggestion.structured_location as {
      address?: string | null;
    };
    if (structured.address) {
      return structured.address;
    }
  }
  return suggestion.location ?? undefined;
}

function mapBoundsToLatLngBounds(mapBounds?: SuggestionMapBounds | null) {
  if (!mapBounds) return null;
  return L.latLngBounds(
    [mapBounds.southwest.latitude, mapBounds.southwest.longitude],
    [mapBounds.northeast.latitude, mapBounds.northeast.longitude],
  );
}

function MapViewport({
  center,
  bounds,
  zoom,
}: {
  center: LatLngExpression;
  bounds?: LatLngBoundsExpression | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24] });
    } else {
      map.setView(center, zoom ?? map.getZoom());
    }
  }, [map, center, bounds, zoom]);

  return null;
}

function PickleMap({ suggestions }: { suggestions: Suggestion[] }) {
  const markers = useMemo(
    () =>
      suggestions
        .map((suggestion) => ({
          suggestion,
          coords: getSuggestionCoordinates(suggestion),
          address: getSuggestionAddress(suggestion),
          bounds: mapBoundsToLatLngBounds(suggestion.map_bounds),
        }))
        .filter(
          (
            item,
          ): item is {
            suggestion: Suggestion;
            coords: [number, number];
            address: string | undefined;
            bounds: ReturnType<typeof mapBoundsToLatLngBounds>;
          } => Array.isArray(item.coords),
        ),
    [suggestions],
  );

  const center: LatLngExpression = markers[0]?.coords ?? DEFAULT_CENTER;
  const zoom = markers.length ? 12 : 13;

  const bounds: LatLngBoundsExpression | null = useMemo(() => {
    if (!markers.length) {
      return null;
    }

    const structuredBounds = markers
      .map((marker) => marker.bounds)
      .filter((b): b is L.LatLngBounds => Boolean(b));

    if (structuredBounds.length) {
      const [first, ...rest] = structuredBounds;
      return rest.reduce((acc, curr) => acc.extend(curr), first.pad(0.05));
    }

    if (markers.length > 1) {
      return markers
        .slice(1)
        .reduce(
          (acc, { coords }) => acc.extend(coords),
          L.latLngBounds(markers[0].coords, markers[0].coords),
        )
        .pad(0.05);
    }

    return null;
  }, [markers]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-56 w-full pickle-map"
        style={{ filter: "hue-rotate(-8deg) saturate(1.1)" }}
      >
        <MapViewport center={center} bounds={bounds} zoom={zoom} />
        <ZoomControl position="topright" />
        <TileLayer
          attribution={
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {markers.map(({ suggestion, coords, address }) => (
          <CircleMarker
            key={suggestion.id}
            center={coords}
            radius={10}
            pathOptions={{
              color: "#059669",
              fillColor: "#34d399",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <p className="text-sm font-semibold text-gray-900">
                {suggestion.title}
              </p>
              {address && (
                <p className="mt-1 text-xs text-gray-600">{address}</p>
              )}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function PickleJarPage() {
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const [picklejar, setPicklejar] = useState<PickleJar | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [phone, setPhone] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberPhone, setMemberPhone] = useState<string | null>(null);
  const [isLocalCreator, setIsLocalCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [results, setResults] = useState<Result[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [isSharing, setIsSharing] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const heroImage = HERO_IMAGES[heroImageIndex] ?? HERO_IMAGES[0];

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/jar/${id}`;
  }, [id]);

  const normalizedStatus: PickleJarStatus | "unknown" = useMemo(() => {
    if (!picklejar?.status) return "unknown";
    const s = picklejar.status.toLowerCase();
    if (s === "setup") return "setup";
    if (s === "suggesting") return "suggesting";
    if (s === "voting") return "voting";
    if (s === "completed") return "completed";
    if (s === "cancelled") return "cancelled";
    return "unknown";
  }, [picklejar?.status]);

  const isHost = useMemo(() => {
    if (!picklejar?.creator_phone || !memberPhone) return false;
    return (
      normalizePhone(picklejar.creator_phone) === normalizePhone(memberPhone)
    );
  }, [picklejar?.creator_phone, memberPhone]);

  const canEdit = useMemo(
    () => isHost || isLocalCreator,
    [isHost, isLocalCreator],
  );

  // Fetch core jar + members
  useEffect(() => {
    if (!id) return;

    const fetchPicklejar = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
        );
        setPicklejar(res.data);
      } catch (error) {
        console.error("Failed to fetch PickleJar:", error);
      }
    };

    const fetchMembers = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/members`,
        );
        setMembers(res.data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };

    fetchPicklejar();
    fetchMembers();

    const storedMemberId = localStorage.getItem(`pj_member_${id}`);
    if (storedMemberId) {
      setMemberId(storedMemberId);
      setIsMember(true);
    }

    const creatorFlag = localStorage.getItem(`pj_creator_${id}`);
    setIsLocalCreator(creatorFlag === "true");
  }, [id]);

  useEffect(() => {
    if (!memberId) {
      setMemberPhone(null);
      return;
    }

    const fetchMemberDetails = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/members/member/${memberId}`,
        );
        setMemberPhone(res.data.phone_number || null);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          localStorage.removeItem(`pj_member_${id}`);
          setMemberId(null);
          setIsMember(false);
          setMemberPhone(null);
        }
        console.error("Failed to fetch member details:", error);
      }
    };

    fetchMemberDetails();
  }, [id, memberId]);

  // Fetch suggestions when in suggesting/voting/completed
  useEffect(() => {
    if (!id) return;
    if (
      normalizedStatus !== "suggesting" &&
      normalizedStatus !== "voting" &&
      normalizedStatus !== "completed"
    ) {
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggestions`,
        );
        setSuggestions(res.data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [id, normalizedStatus]);

  // Fetch results when completed
  useEffect(() => {
    if (!id) return;
    if (normalizedStatus !== "completed") return;

    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}/results`,
        );

        // Backend returns { picklejar, winner, all_suggestions, stats }
        const allSuggestions = res.data.all_suggestions || [];
        const winnerId = res.data.winner?.suggestion?.id;

        const mappedResults: Result[] = allSuggestions.map((s: any) => ({
          suggestion_id: s.id,
          title: s.title,
          description: s.description,
          total_points: s.total_points,
          is_winner: s.id === winnerId,
        }));

        const sorted = mappedResults.sort(
          (a: Result, b: Result) => b.total_points - a.total_points,
        );
        setResults(sorted);
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [id, normalizedStatus]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedPhone = normalizePhone(phone);
    if (!sanitizedPhone) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const joinRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/join`,
        { phone_number: sanitizedPhone },
      );
      const newMemberId = joinRes.data.id;
      setMemberId(newMemberId);
      setMemberPhone(joinRes.data.phone_number || null);
      localStorage.setItem(`pj_member_${id}`, newMemberId);
      setIsMember(true);

      // Refetch members so counts update
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/members`,
      );
      setMembers(res.data);
      setPhone("");
    } catch (error: any) {
      console.error("Failed to join:", error);
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to join this PickleJar.";
      setJoinError(typeof msg === "string" ? msg : "Unable to join.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    setIsSharing(true);
    setCopyState("idle");

    try {
      // Try native share first
      const canShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof (navigator as any).share === "function";

      if (canShare) {
        await (navigator as any).share({
          title: picklejar?.title || "PickleJar",
          text: "Join this PickleJar to drop pickles and vote on what to do.",
          url: shareUrl,
        });
        setIsSharing(false);
        return;
      }

      // Fallback to clipboard
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setCopyState("copied");
        addToast("Link copied to clipboard!", "success");
        setTimeout(() => setCopyState("idle"), 2500);
      }
    } catch (error) {
      console.error("Error sharing picklejar:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      addToast("Link copied to clipboard!", "success");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch (error) {
      console.error("Error copying link:", error);
      addToast("Failed to copy link.", "error");
    }
  };

  const cycleHeroImage = () => {
    setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  const isLoading = !picklejar;

  const memberCount = members.length;
  const suggestionCount = suggestions.length;
  const estimatedPointsPerVoter =
    picklejar?.points_per_voter ??
    (suggestionCount > 1 ? Math.max(suggestionCount - 1, 1) : 1);

  const renderStatusBadge = () => {
    if (normalizedStatus === "unknown") return null;

    const isStarted =
      normalizedStatus !== "setup" && normalizedStatus !== "cancelled";

    const labelMap: Record<PickleJarStatus, string> = {
      setup: "Not started",
      suggesting: "Collecting pickles",
      voting: "Voting in progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-700">
        <Circle
          className={classNames(
            "h-2 w-2 fill-current",
            isStarted ? "text-emerald-500" : "text-gray-300",
          )}
        />
        <span className="text-xs font-semibold tracking-wide uppercase">
          {labelMap[normalizedStatus]}
        </span>
      </div>
    );
  };

  const renderPhaseContent = () => {
    if (!picklejar) {
      return <div className="mt-8 text-gray-500">Loading...</div>;
    }

    if (normalizedStatus === "setup" || normalizedStatus === "unknown") {
      return (
        <div className="mt-8 text-gray-600 text-lg font-light">
          <p>
            Waiting for the host to start the pickle jar (suggestion) phase.
          </p>
        </div>
      );
    }

    if (normalizedStatus === "suggesting") {
      return (
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-light text-gray-900">
                  Pickle Jar (pickles/suggestions)
                </h2>
                {picklejar.suggestion_deadline && (
                  <p className="text-sm font-medium text-red-600">
                    Ends{" "}
                    {format(new Date(picklejar.suggestion_deadline), "PPp")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Add New Card */}
              <Link
                href={
                  memberId
                    ? `/jar/${id}/suggest?member_id=${memberId}`
                    : `/jar/${id}/suggest`
                }
                className="relative flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center transition-all group overflow-hidden hover:border-emerald-500/80 hover:bg-emerald-50/40"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.35),_transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors relative z-10">
                  <span className="text-lg font-medium">+</span>
                </div>
                <span className="font-medium text-gray-900 relative z-10 group-hover:text-emerald-900">
                  Drop a Pickle
                </span>
              </Link>

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                {loadingSuggestions && (
                  <div className="text-gray-500 py-8 text-center">
                    Loading pickles…
                  </div>
                )}

                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {s.description}
                      </p>
                    )}
                    {s.location && (
                      <p className="mt-auto text-xs font-medium text-gray-400 uppercase tracking-wide pt-2 border-t border-gray-50">
                        📍 {s.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-l border-gray-100 pl-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Who&apos;s in ({memberCount})
            </h3>
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-500">
                      {(m.id === memberId
                        ? "Me"
                        : m.display_name || "Anonymous"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <span>
                      {m.id === memberId ? "Me" : m.display_name || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.has_suggested && (
                      <span
                        className="h-2 w-2 rounded-full bg-blue-500"
                        title="Dropped a pickle"
                      ></span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (normalizedStatus === "voting") {
      return (
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-light text-gray-900">Voting</h2>
              {picklejar.voting_deadline && (
                <p className="text-sm font-medium text-red-600">
                  Ends {format(new Date(picklejar.voting_deadline), "PPp")}
                </p>
              )}
            </div>
            <p className="mb-8 text-gray-600">
              You have{" "}
              <span className="font-semibold text-gray-900">
                {estimatedPointsPerVoter > 0
                  ? estimatedPointsPerVoter
                  : "a few"}{" "}
                points
              </span>{" "}
              to spend.
            </p>

            <div className="mb-8 flex flex-wrap items-center gap-4">
              <Link
                href={
                  memberId
                    ? `/jar/${id}/vote?member_id=${memberId}`
                    : `/jar/${id}/vote`
                }
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all"
              >
                Go to voting ↵
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Pickles on the ballot
              </h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                {loadingSuggestions && (
                  <p className="text-gray-500">Loading pickles…</p>
                )}
                {!loadingSuggestions && suggestions.length === 0 && (
                  <p className="text-gray-500 italic">
                    No pickles to vote on yet.
                  </p>
                )}
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <h4 className="text-lg font-medium text-gray-900">
                      {s.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-l border-gray-100 pl-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Votes Cast
            </h3>
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm text-gray-700"
                >
                  <span>{m.display_name || "Anonymous"}</span>
                  {m.has_voted ? (
                    <span className="text-emerald-600 font-medium">
                      ✓ Voted
                    </span>
                  ) : (
                    <span className="text-gray-400">Waiting...</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (normalizedStatus === "completed") {
      const winner = results.find((r) => r.is_winner) || results[0];

      return (
        <div className="mt-8 space-y-12">
          <div className="bg-emerald-50/50 border-l-4 border-emerald-500 p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-2">
              Winning Pickle
            </h2>
            {loadingResults && (
              <p className="text-emerald-800">Loading results…</p>
            )}
            {!loadingResults && winner && (
              <>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {winner.title}
                </p>
                {winner.description && (
                  <p className="text-xl text-gray-600 mb-4">
                    {winner.description}
                  </p>
                )}
                <p className="text-lg font-medium text-emerald-700">
                  {winner.total_points} points • 🥒 Crowned pickle
                </p>
              </>
            )}
            {!loadingResults && !winner && (
              <p className="text-gray-900">No votes recorded yet.</p>
            )}
          </div>

          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-light text-gray-900">
                Pickle breakdown
              </h3>
            </div>

            <div className="space-y-2">
              {loadingResults && (
                <p className="text-gray-500">Loading results…</p>
              )}
              {!loadingResults && results.length === 0 && (
                <p className="text-gray-500">No results available.</p>
              )}
              {!loadingResults &&
                results.map((r, index) => (
                  <div
                    key={r.suggestion_id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-300 w-8">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {r.title}
                        </p>
                        {r.description && (
                          <p className="text-sm text-gray-500">
                            {r.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {r.total_points}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }

    // Cancelled or fallback
    return (
      <div className="mt-8 text-gray-500">
        <p>This PickleJar is no longer active.</p>
      </div>
    );
  };

  const shouldShowMap =
    normalizedStatus === "suggesting" ||
    normalizedStatus === "voting" ||
    normalizedStatus === "completed";

  const statusBadge = renderStatusBadge();

  return (
    <div className="min-h-screen bg-white px-6 py-12 pb-32 text-gray-900">
      <div className="mx-auto max-w-3xl">
        {isLoading ? (
          <div className="p-6">
            <p className="text-lg text-gray-500">Loading PickleJar…</p>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="group relative h-48 md:h-56 overflow-hidden rounded-3xl bg-gray-900/5">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${heroImage})` }}
                  role="img"
                  aria-label="PickleJar hero banner"
                />
                <div className="pointer-events-none relative flex h-full flex-col justify-end bg-gradient-to-t from-black/40 via-black/10 to-transparent p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                    PickleJar vibe check
                  </p>
                  <h2 className="text-3xl font-semibold text-white">
                    {picklejar?.title || "Your next plan, jarred up"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={cycleHeroImage}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg backdrop-blur focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 group-hover:opacity-100 opacity-0 transition-opacity duration-200"
                >
                  Shuffle banner ↻
                </button>
              </div>
            </section>
            {/* Header: title, description, status, share/edit */}
            <header className="mb-8 border-b border-gray-100 pb-8 space-y-6">
              {statusBadge && <div>{statusBadge}</div>}
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                      {picklejar?.title || "Untitled PickleJar"}
                    </h1>
                  </div>
                  {picklejar?.description && (
                    <p className="max-w-2xl text-xl text-gray-600 font-light">
                      {picklejar.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {canEdit && (
                    <Link
                      href={`/jar/${id}/edit`}
                      className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </header>

            {/* Join section (minimal, inline) */}
            {!isMember ? (
              <section className="mt-12 max-w-lg">
                <h2 className="text-2xl font-light text-gray-900 mb-6">
                  Join to participate
                </h2>
                <form onSubmit={handleJoin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Your Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formatPhoneForInput(phone)}
                      onChange={(e) => setPhone(extractDigits(e.target.value))}
                      placeholder="(555) 012-3456"
                      className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-2xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isJoining || !phone}
                    className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-3 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                    {isJoining ? "Joining…" : "Join PickleJar ↵"}
                  </button>
                </form>
                {joinError && (
                  <p className="mt-4 text-sm text-red-600 bg-red-50 inline-block px-3 py-1 rounded">
                    ⚠️ {joinError}
                  </p>
                )}
              </section>
            ) : (
              <>
                {/* Phase-aware section */}
                {renderPhaseContent()}
                {shouldShowMap && (
                  <div className="mt-12 border-t border-gray-100 pt-6">
                    {loadingSuggestions ? (
                      <div className="h-56 rounded-2xl border border-dashed border-gray-200 bg-gray-50 animate-pulse" />
                    ) : (
                      <PickleMap suggestions={suggestions} />
                    )}
                  </div>
                )}
              </>
            )}

            {/* Share Link Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm p-4 text-center z-50">
              <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-4">
                <p className="text-sm text-gray-500">Share with your group:</p>
                <div className="flex items-center justify-center gap-2 rounded-md bg-gray-50 p-1 pr-2 w-fit border border-gray-200">
                  <div className="px-3 py-1 text-sm text-gray-600 font-mono max-w-[200px] sm:max-w-md truncate">
                    {shareUrl.replace(/^https?:\/\//, "")}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center rounded bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                    title="Copy link"
                  >
                    {copyState === "copied" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
