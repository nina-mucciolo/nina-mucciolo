import Link from "next/link";

export default function Shell({
  title,
  active,
  children,
  action,
}: {
  title: string;
  active?: "graph" | "add" | "friends";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <h1>{title}</h1>
        {action}
      </header>
      <main className="content">{children}</main>
      <nav className="tabbar" aria-label="Main">
        <Link href="/" className={active === "graph" ? "on" : ""}>
          <span aria-hidden>📈</span>My graph
        </Link>
        <Link href="/add" className={`add ${active === "add" ? "on" : ""}`}>
          <span aria-hidden>＋</span>Add
        </Link>
        <Link href="/friends" className={active === "friends" ? "on" : ""}>
          <span aria-hidden>👯</span>Friends
        </Link>
      </nav>
    </div>
  );
}
