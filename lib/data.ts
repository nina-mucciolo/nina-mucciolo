import "server-only";
import { redirect } from "next/navigation";
import { getUser } from "./supabase/server";

export type Place = {
  place_id: string;
  name: string;
  address: string | null;
  photo_path: string | null;
  photo_attribution: string | null;
  photo_attribution_uri: string | null;
};

export type RatedPlace = {
  place_id: string;
  yum: number;
  dollars: number;
  note: string | null;
  updated_at: string;
  place: Place;
};

export function photoUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/place-photos/${encodeURIComponent(path)}`;
}

/** Signed-in user with a username, or redirect to login / onboarding. */
export async function requireProfile() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", user.id)
    .single();
  if (!profile?.username) redirect("/onboarding");
  return { supabase, user, profile: profile as { id: string; username: string; display_name: string | null } };
}

type Supa = Awaited<ReturnType<typeof getUser>>["supabase"];

export async function ratingsFor(supabase: Supa, userId: string): Promise<RatedPlace[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select("place_id, yum, dollars, note, updated_at, place:places(place_id, name, address, photo_path, photo_attribution, photo_attribution_uri)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    yum: Number(r.yum),
    dollars: Number(r.dollars),
    place: r.place as unknown as Place,
  }));
}

export type Friend = { id: string; username: string; display_name: string | null };

export async function friendsOf(supabase: Supa, userId: string) {
  const { data } = await supabase
    .from("friendships")
    .select("requester, addressee, status, r:profiles!friendships_requester_fkey(id, username, display_name), a:profiles!friendships_addressee_fkey(id, username, display_name)");
  const friends: Friend[] = [];
  const incoming: Friend[] = [];
  const outgoing: Friend[] = [];
  for (const f of data ?? []) {
    const other = (f.requester === userId ? f.a : f.r) as unknown as Friend;
    if (f.status === "accepted") friends.push(other);
    else if (f.addressee === userId) incoming.push(other);
    else outgoing.push(other);
  }
  return { friends, incoming, outgoing };
}

export function displayName(p: { username: string; display_name: string | null }) {
  return p.display_name || `@${p.username}`;
}
