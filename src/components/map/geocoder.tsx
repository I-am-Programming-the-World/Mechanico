"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  place_name: string;
  center: [number, number];
};

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
}

export function Geocoder({
  onSelect,
  savedPlaces,
}: {
  onSelect: (p: { lat: number; lng: number; label: string }) => void;
  savedPlaces?: Array<{ label: string; lat: number; lng: number }>;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!token || query.trim().length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      const controller = new AbortController();
      
      const fetchData = async () => {
        try {
          const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
          url.searchParams.set("access_token", token);
          url.searchParams.set("autocomplete", "true");
          url.searchParams.set("limit", "5");
          const res = await fetch(url.toString(), { signal: controller.signal });
          const data = (await res.json()) as { features?: MapboxFeature[] };
          const feats = data.features ?? [];
          setResults(
            feats.map((f) => ({
              id: f.id,
              place_name: f.place_name,
              center: f.center,
            })),
          );
        } catch {
          // ignore aborted requests
        } finally {
          setLoading(false);
        }
      };

      void fetchData();
      return () => controller.abort();
    }, 300);
    return () => clearTimeout(id);
  }, [query, token]);

  return (
    <div className="pointer-events-auto w-full max-w-md">
      <div className="rounded-full border bg-white px-3 py-2 shadow">
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="جستجوی آدرس یا مکان"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading && <div className="mt-1 text-xs text-gray-500">Searching...</div>}
      {!loading && results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-md border bg-white shadow">
          {results.map((r) => (
            <li key={r.id}>
              <button
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() =>
                  onSelect({ lat: r.center[1], lng: r.center[0], label: r.place_name })
                }
              >
                {r.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {(!loading && (!results.length || query.trim().length < 3)) && (savedPlaces?.length ?? 0) > 0 && (
        <div className="mt-2 overflow-hidden rounded-md border bg-white p-2 shadow">
          <div className="mb-1 text-xs font-medium text-gray-700">Saved places</div>
          <div className="flex flex-wrap gap-2">
            {savedPlaces!.map((p, idx) => (
              <button
                key={`${p.label}-${idx}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                onClick={() => onSelect({ lat: p.lat, lng: p.lng, label: p.label })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}