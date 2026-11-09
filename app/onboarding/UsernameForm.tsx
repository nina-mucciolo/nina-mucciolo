"use client";
import { useActionState } from "react";
import { setUsername } from "@/app/actions";

export default function UsernameForm({ username, displayName }: { username: string; displayName: string }) {
  const [state, action, pending] = useActionState(setUsername, undefined);
  return (
    <form action={action} className="stack">
      <label>
        Username
        <div className="prefixed"><span>@</span>
          <input name="username" required defaultValue={username} pattern="[a-z0-9_]{3,20}"
            autoCapitalize="none" autoCorrect="off" placeholder="nina_eats" />
        </div>
      </label>
      <label>
        Display name <span className="muted">(optional)</span>
        <input name="display_name" defaultValue={displayName} maxLength={40} placeholder="Nina" />
      </label>
      <button className="btn primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
