"use client";

import Link from "next/link";

export function Shell({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle?: string;
  active?: "home" | "fer" | "ws";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(217,119,6,0.18),transparent_55%),radial-gradient(900px_circle_at_80%_30%,rgba(59,130,246,0.14),transparent_55%),linear-gradient(to_bottom,rgba(250,250,249,1),rgba(255,252,248,1))]">
      <header className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-xs text-stone-700 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              Prosecution Studio
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{title}</h1>
            {subtitle ? <p className="max-w-2xl text-sm text-stone-600">{subtitle}</p> : null}
          </div>

          <nav className="flex items-center gap-2">
            <NavPill href="/" active={active === "home"}>Home</NavPill>
            <NavPill href="/fer" active={active === "fer"}>FER</NavPill>
            <NavPill href="/ws" active={active === "ws"}>WS</NavPill>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">{children}</main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-stone-500">
        A Product of Lextria Research
      </footer>
    </div>
  );
}

function NavPill({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm shadow-sm transition",
        active
          ? "bg-stone-900 text-white"
          : "border border-stone-200 bg-white/70 text-stone-800 backdrop-blur hover:bg-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
