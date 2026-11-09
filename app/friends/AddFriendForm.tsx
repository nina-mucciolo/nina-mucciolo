"use client";
import { useActionState } from "react";
import { sendFriendRequest } from "@/app/actions";

export default function AddFriendForm() {
  const [state, action, pending] = useActionState(sendFriendRequest, undefined);
  return (
    <form action={action} className="stack">
      <div className="search">
        <div className="prefixed grow"><span>@</span>
          <input name="username" required placeholder="friend's username" autoCapitalize="none" autoCorrect="off" />
        </div>
        <button className="btn primary" disabled={pending}>Add</button>
      </div>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.ok && <p className="ok">{state.ok}</p>}
    </form>
  );
}
