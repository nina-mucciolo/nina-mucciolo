import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { displayName, photoUrl, ratingsFor, requireProfile } from "@/lib/data";
import { compare } from "@/lib/compare";
import { removeFriend } from "@/app/actions";
import CompareView from "./CompareView";

export default async function ComparePage({ params }: { params: Promise<{ friendId: string }> }) {
  const { friendId } = await params;
  const { supabase, user } = await requireProfile();

  const { data: areFriends } = await supabase.rpc("are_friends", { a: user.id, b: friendId });
  if (!areFriends) notFound();
  const { data: friend } = await supabase.from("profiles").select("id, username, display_name").eq("id", friendId).single();
  if (!friend) notFound();

  const [mine, theirs] = await Promise.all([ratingsFor(supabase, user.id), ratingsFor(supabase, friendId)]);
  const c = compare(mine, theirs);
  const theirsById = new Map(theirs.map((r) => [r.place_id, r]));
  const name = displayName(friend);

  return (
    <Shell title={`You vs ${name}`} active="friends">
      <CompareView
        friendName={name}
        mine={mine.map((r) => ({ id: r.place_id, yum: r.yum, dollars: r.dollars, name: r.place.name }))}
        theirs={theirs.map((r) => ({ id: r.place_id, yum: r.yum, dollars: r.dollars, name: r.place.name }))}
        sharedIds={c.shared.map((s) => s.place_id)}
        matchScore={c.matchScore}
        yumBias={c.yumBias}
        tryNext={c.tryNext.map((t) => {
          const r = theirsById.get(t.place_id)!;
          return {
            ...t, name: r.place.name, address: r.place.address, note: r.note, photo: photoUrl(r.place.photo_path),
          };
        })}
      />
      <form action={removeFriend} className="center">
        <input type="hidden" name="user_id" value={friendId} />
        <button className="btn ghost danger small">Remove friend</button>
      </form>
    </Shell>
  );
}
