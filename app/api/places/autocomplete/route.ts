import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { autocomplete } from "@/lib/places";
import { placesFailure } from "@/lib/places-response";

export async function POST(req: Request) {
  // Only signed-in users can spend Places quota.
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    input?: unknown; sessionToken?: unknown; lat?: unknown; lng?: unknown;
  };
  const input = typeof body.input === "string" ? body.input.trim().slice(0, 100) : "";
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken.slice(0, 64) : "";
  if (input.length < 2 || !sessionToken) return NextResponse.json({ suggestions: [] });

  try {
    const suggestions = await autocomplete({
      input,
      sessionToken,
      lat: typeof body.lat === "number" ? body.lat : undefined,
      lng: typeof body.lng === "number" ? body.lng : undefined,
    });
    return NextResponse.json({ suggestions });
  } catch (e) {
    return placesFailure(e);
  }
}
