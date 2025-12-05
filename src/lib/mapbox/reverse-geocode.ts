const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  // In production you may want to throw; for now we fail gracefully.
  console.warn("NEXT_PUBLIC_MAPBOX_TOKEN is not set; reverse geocoding will be disabled.");
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
    );
    url.searchParams.set("access_token", MAPBOX_TOKEN);
    url.searchParams.set("language", "fa");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as {
      features?: Array<{ place_name?: string }>;
    };

    const name = data.features?.[0]?.place_name;
    return name ?? null;
  } catch {
    return null;
  }
}
