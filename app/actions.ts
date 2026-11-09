"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function num(v: FormDataEntryValue | null) {
  const n = Math.round(Number(v) * 10) / 10;
  return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : null;
}

export async function saveRating(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const placeId = String(formData.get("place_id") ?? "");
  const yum = num(formData.get("yum"));
  const dollars = num(formData.get("dollars"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 280) || null;
  if (!placeId || yum === null || dollars === null) throw new Error("Missing rating");

  const { error } = await supabase.from("ratings").upsert({
    user_id: user.id, place_id: placeId, yum, dollars, note, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  revalidatePath("/");
  redirect(`/?added=${encodeURIComponent(placeId)}`);
}

export async function deleteRating(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  await supabase.from("ratings").delete().eq("user_id", user.id).eq("place_id", String(formData.get("place_id")));
  revalidatePath("/");
  redirect("/");
}

export type FormState = { error?: string; ok?: string } | undefined;

export async function setUsername(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim().slice(0, 40) || null;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "3–20 characters: lowercase letters, numbers, underscores." };
  }
  const { error } = await supabase.from("profiles").update({ username, display_name }).eq("id", user.id);
  if (error) return { error: error.code === "23505" ? "That username is taken." : error.message };
  redirect("/");
}

export async function sendFriendRequest(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const username = String(formData.get("username") ?? "").trim().replace(/^@/, "").toLowerCase();
  const { data: other } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (!other) return { error: `No one called @${username}.` };
  if (other.id === user.id) return { error: "That's you!" };

  // If they already asked us, accept instead of making a duplicate.
  const { data: theirs } = await supabase
    .from("friendships").select("status").eq("requester", other.id).eq("addressee", user.id).maybeSingle();
  if (theirs) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("requester", other.id).eq("addressee", user.id);
    revalidatePath("/friends");
    return { ok: `You and @${username} are now friends.` };
  }

  const { error } = await supabase.from("friendships").insert({ requester: user.id, addressee: other.id });
  if (error) return { error: error.code === "23505" ? "Request already sent." : error.message };
  revalidatePath("/friends");
  return { ok: `Request sent to @${username}.` };
}

export async function respondToRequest(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const other = String(formData.get("user_id"));
  if (formData.get("accept") === "1") {
    await supabase.from("friendships").update({ status: "accepted" }).eq("requester", other).eq("addressee", user.id);
  } else {
    await supabase.from("friendships").delete().eq("requester", other).eq("addressee", user.id);
  }
  revalidatePath("/friends");
}

export async function removeFriend(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const other = String(formData.get("user_id"));
  if (!UUID.test(other)) return;
  await supabase.from("friendships").delete().or(
    `and(requester.eq.${user.id},addressee.eq.${other}),and(requester.eq.${other},addressee.eq.${user.id})`,
  );
  revalidatePath("/friends");
  redirect("/friends");
}
