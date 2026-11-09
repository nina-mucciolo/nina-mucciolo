"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ? "That link expired or was already used. Try again." : "");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setError(error.message);
    else {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <img src="/icon.svg" alt="" width={72} height={72} />
        <h1>Dollars to Yum Yums</h1>
        <p className="muted">Is it worth it? Plot every meal: tastiness across, price up.</p>

        {!sent ? (
          <form onSubmit={send} className="stack">
            <label>
              Email
              <input type="email" required autoComplete="email" inputMode="email"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <button className="btn primary" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="stack">
            <p>Check <b>{email}</b>. Tap the link, or type the 6-digit code here:</p>
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8}
              value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="code" />
            <button className="btn primary" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Sign in"}</button>
            <button type="button" className="btn ghost" onClick={() => setSent(false)}>Use a different email</button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
