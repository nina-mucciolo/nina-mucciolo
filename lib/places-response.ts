import "server-only";
import { NextResponse } from "next/server";
import { PlacesError } from "./places";

export function placesFailure(e: unknown) {
  console.error(e);
  if (e instanceof PlacesError && e.status === 429) {
    return NextResponse.json(
      { error: "Today's restaurant search limit has been reached. Try again tomorrow." },
      { status: 429 },
    );
  }
  return NextResponse.json({ error: "Restaurant search is unavailable right now." }, { status: 502 });
}
