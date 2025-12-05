export type DirectionsResult = {
  coordinates: Array<{ lat: number; lng: number }>;
  durationMinutes: number;
};

export async function getDrivingDirections(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  opts?: { signal?: AbortSignal },
): Promise<DirectionsResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");

  const res = await fetch(url.toString(), { signal: opts?.signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> }; duration?: number }> };
  const route = data?.routes?.[0];
  if (!route) return null;

  const coords: Array<{ lat: number; lng: number }> =
    (route.geometry?.coordinates ?? []).map((c: [number, number]) => ({
      lng: c[0],
      lat: c[1],
    }));

  const durationMinutes = Math.round((route.duration ?? 0) / 60);

  return { coordinates: coords, durationMinutes };
}