import { Code2 } from "lucide-react";

/* Only links to routes that actually exist in CollabCode */
const NAV_LINKS = [
  { label: "Log in",    href: "/login" },
  { label: "Sign up",  href: "/register" },
  { label: "Dashboard",href: "/dashboard" },
] as const;

export function HomeFooter() {
  return (
    <footer
      className="relative z-10 border-t"
      style={{ borderColor: "hsl(var(--border) / 0.35)" }}
      aria-label="Site footer"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg border"
              style={{
                background: "hsl(172 72% 45% / 0.10)",
                borderColor: "hsl(172 72% 45% / 0.25)",
              }}
            >
              <Code2 size={14} className="text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-foreground">CollabCode</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            Real-time collaboration for developers.
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-muted-foreground/55 transition-colors duration-150 hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground/35">
          © {new Date().getFullYear()} CollabCode
        </p>
      </div>
    </footer>
  );
}
