import Link from "next/link";
export default function NotFound() {
  return (
    <div className="login"><div className="login-card">
      <h1>Not found</h1>
      <p className="muted">That place or friend isn&apos;t here.</p>
      <Link href="/" className="btn primary">Back to my graph</Link>
    </div></div>
  );
}
