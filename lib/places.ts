import "server-only";

/**
 * Thin wrapper around Google Places API (New). Every call runs on the server,
 * so GOOGLE_PLACES_API_KEY never reaches the browser.
 *
 * Cost notes (free monthly allowance per SKU, as of the March 2025 pricing):
 *  - Autocomplete: requests inside a session that ends in a Place Details call are free.
 *  - Place Details: we ask for displayName → "Pro" SKU.
 *  - Place Photo: "Enterprise" SKU — the smallest free allowance, so we fetch one
 *    photo per place, once, and cache it in Supabase Storage.
 */

const BASE = "https://places.googleapis.com/v1";

function key() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new Error("GOOGLE_PLACES_API_KEY is not set");
  return k;
}

const DEFAULT_TYPES = ["restaurant", "cafe", "bar", "bakery", "meal_takeaway"];

function autocompleteTypes() {
  const raw = process.env.PLACES_AUTOCOMPLETE_TYPES;
  if (!raw) return DEFAULT_TYPES;
  return raw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);
}

export type Suggestion = { placeId: string; name: string; secondary: string };

export async function autocomplete(opts: {
  input: string;
  sessionToken: string;
  lat?: number;
  lng?: number;
}): Promise<Suggestion[]> {
  const body: Record<string, unknown> = {
    input: opts.input,
    sessionToken: opts.sessionToken,
    includedPrimaryTypes: autocompleteTypes(),
  };
  if (typeof opts.lat === "number" && typeof opts.lng === "number") {
    body.locationBias = {
      circle: { center: { latitude: opts.lat, longitude: opts.lng }, radius: 30000 },
    };
  }

  const res = await fetch(`${BASE}/places:autocomplete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new PlacesError(res.status, await res.text());

  const json = (await res.json()) as {
    suggestions?: {
      placePrediction?: {
        placeId: string;
        text?: { text: string };
        structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
      };
    }[];
  };

  return (json.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
    .map((p) => ({
      placeId: p.placeId,
      name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photoName: string | null;
  photoAttribution: string | null;
  photoAttributionUri: string | null;
};

export async function placeDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails> {
  const url = new URL(`${BASE}/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key(),
      // Field mask keeps us on the cheapest SKU that includes the name.
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,photos",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new PlacesError(res.status, await res.text());

  const p = (await res.json()) as {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
  };
  const photo = p.photos?.[0];
  const author = photo?.authorAttributions?.[0];

  return {
    placeId: p.id,
    name: p.displayName?.text ?? "Unknown place",
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    photoName: photo?.name ?? null,
    photoAttribution: author?.displayName ?? null,
    photoAttributionUri: author?.uri ?? null,
  };
}

/** Downloads one photo (≤ 600px wide). Returns null on any failure — a photo is optional. */
export async function fetchPhoto(photoName: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const url = `${BASE}/${photoName}/media?maxWidthPx=600&key=${encodeURIComponent(key())}`;
    const res = await fetch(url, { cache: "no-store", redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    return { bytes: await res.arrayBuffer(), contentType };
  } catch {
    return null;
  }
}

export class PlacesError extends Error {
  constructor(public status: number, body: string) {
    super(`Places API ${status}: ${body.slice(0, 300)}`);
  }
}

/** Google place IDs are URL-safe base64-ish strings. Reject anything else early. */
export function isValidPlaceId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{10,300}$/.test(id);
}
