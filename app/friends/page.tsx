import Link from "next/link";
import Shell from "@/components/Shell";
import { displayName, friendsOf, requireProfile } from "@/lib/data";
import { respondToRequest } from "@/app/actions";
import AddFriendForm from "./AddFriendForm";

export default async function FriendsPage() {
  const { supabase, user, profile } = await requireProfile();
  const { friends, incoming, outgoing } = await friendsOf(supabase, user.id);

  return (
    <Shell title="Friends" active="friends">
      <AddFriendForm />
      <p className="muted small">Your username is <b>@{profile.username}</b> — share it so friends can add you.</p>

      {incoming.length > 0 && (
        <section>
          <h2>Requests</h2>
          <ul className="list">
            {incoming.map((f) => (
              <li key={f.id} className="card row between">
                <span>{displayName(f)} <span className="muted small">@{f.username}</span></span>
                <form action={respondToRequest} className="row">
                  <input type="hidden" name="user_id" value={f.id} />
                  <button name="accept" value="1" className="btn small primary">Accept</button>
                  <button name="accept" value="0" className="btn small ghost">Ignore</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Compare with…</h2>
        {friends.length === 0 ? (
          <p className="muted">No friends yet. Add someone by username above.</p>
        ) : (
          <ul className="list">
            {friends.map((f) => (
              <li key={f.id}>
                <Link href={`/compare/${f.id}`} className="list-btn">
                  <span className="name">{displayName(f)}</span>
                  <span className="muted small">@{f.username} · overlay graphs →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h2>Pending</h2>
          <ul className="list">
            {outgoing.map((f) => (
              <li key={f.id} className="muted">@{f.username} — waiting for them to accept</li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
