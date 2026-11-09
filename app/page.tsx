import Link from "next/link";
import Shell from "@/components/Shell";
import MyGraph from "@/components/MyGraph";
import { photoUrl, ratingsFor, requireProfile } from "@/lib/data";

export default async function Home({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const { supabase, user, profile } = await requireProfile();
  const ratings = await ratingsFor(supabase, user.id);
  const { added } = await searchParams;

  return (
    <Shell
      title="My graph"
      active="graph"
      action={
        <details className="menu">
          <summary aria-label="Account">@{profile.username}</summary>
          <div className="menu-pop">
            <Link href="/onboarding">Edit profile</Link>
            <form action="/auth/signout" method="post"><button>Sign out</button></form>
          </div>
        </details>
      }
    >
      {ratings.length === 0 ? (
        <div className="empty">
          <p>No restaurants yet.</p>
          <Link href="/add" className="btn primary">Add your first place</Link>
        </div>
      ) : (
        <MyGraph
          initialSelected={added ?? null}
          items={ratings.map((r) => ({
            id: r.place_id, name: r.place.name, address: r.place.address, yum: r.yum, dollars: r.dollars,
            note: r.note, photo: photoUrl(r.place.photo_path),
          }))}
        />
      )}
    </Shell>
  );
}
