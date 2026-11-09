import { NextResponse } from "next/server";
import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { fetchPhoto, isValidPlaceId, placeDetails } from "@/lib/places";
import { placesFailure } from "@/lib/places-response";

/**
 * Makes sure a place exists in our shared `places` cache and returns it.
 * Google is only called the first time anyone adds that place.
 */
export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { placeId?: unknown; sessionToken?: unknown };
  if (!isValidPlaceId(body.placeId)) return NextResponse.json({ error: "Bad place ID" }, { status: 400 });
  const placeId = body.placeId;
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken.slice(0, 64) : undefined;

  const { data: existing } = await supabase.from("places").select("place_id").eq("place_id", placeId).maybeSingle();
  if (existing) return NextResponse.json({ placeId });

  let details;
  try {
    details = await placeDetails(placeId, sessionToken);
  } catch (e) {
    return placesFailure(e);
  }

  const admin = supabaseAdmin();
  let photoPath: string | null = null;
  if (details.photoName) {
    const photo = await fetchPhoto(details.photoName);
    if (photo) {
      const ext = photo.contentType.includes("png") ? "png" : photo.contentType.includes("webp") ? "webp" : "jpg";
      const path = `${details.placeId}.${ext}`;
      const { error } = await admin.storage
        .from("place-photos")
        .upload(path, photo.bytes, { contentType: photo.contentType, upsert: true, cacheControl: "31536000" });
      if (!error) photoPath = path;
      else console.error("photo upload failed", error);
    }
  }

  // Google can return a different (newer) ID than the one requested; store under the one we were asked for
  // so later lookups hit the cache, matching friends by the same ID they picked.
  const { error } = await admin.from("places").upsert(
    {
      place_id: placeId,
      name: details.name,
      address: details.address,
      lat: details.lat,
      lng: details.lng,
      photo_path: photoPath,
      photo_attribution: photoPath ? details.photoAttribution : null,
      photo_attribution_uri: photoPath ? details.photoAttributionUri : null,
    },
    { onConflict: "place_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save place" }, { status: 500 });
  }
  return NextResponse.json({ placeId });
}
