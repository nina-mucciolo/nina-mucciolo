"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { placeId: string; name: string; secondary: string };

const newToken = () => crypto.randomUUID();

export default function PlaceSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  // One session token per search → pick, so Google bills autocomplete as a single session.
  const token = useRef(newToken());
  const reqId = useRef(0);

  useEffect(() => {
    const input = q.trim();
    if (input.length < 3) {
      setResults([]);
      return;
    }
    // Debounce so we don't spend a request on every keystroke.
    const t = setTimeout(async () => {
      const id = ++reqId.current;
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, sessionToken: token.current, ...loc }),
        });
        const json = await res.json();
        if (id !== reqId.current) return;
        if (!res.ok) setError(json.error ?? "Search failed");
        setResults(json.suggestions ?? []);
      } catch {
        if (id === reqId.current) setError("Search failed");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, loc]);

  function nearMe() {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Couldn't get your location."),
      { maximumAge: 600000, timeout: 8000 },
    );
  }

  async function pick(s: Suggestion) {
    setPicking(s.placeId);
    setError("");
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: s.placeId, sessionToken: token.current }),
    });
    const json = await res.json();
    token.current = newToken();
    if (!res.ok) {
      setPicking(null);
      setError(json.error ?? "Couldn't add that place");
      return;
    }
    router.push(`/rate/${encodeURIComponent(json.placeId)}`);
  }

  return (
    <div className="stack">
      <div className="search">
        <input
          autoFocus
          type="search"
          enterKeyHint="search"
          placeholder="Search restaurants…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search restaurants"
        />
        <button type="button" className={`btn small ${loc ? "on" : ""}`} onClick={nearMe} title="Prefer places near me">
          📍{loc ? " Near me" : ""}
        </button>
      </div>
      {loading && <p className="muted small">Searching…</p>}
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {results.map((s) => (
          <li key={s.placeId}>
            <button className="list-btn" onClick={() => pick(s)} disabled={!!picking}>
              <span className="name">{s.name}</span>
              <span className="muted small">{picking === s.placeId ? "Adding…" : s.secondary}</span>
            </button>
          </li>
        ))}
      </ul>
      {results.length > 0 && <p className="powered">Powered by Google</p>}
      {q.trim().length > 0 && q.trim().length < 3 && <p className="muted small">Keep typing…</p>}
    </div>
  );
}
