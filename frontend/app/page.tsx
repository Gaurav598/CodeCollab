const serviceLinks = [
  {
    label: "Backend Health",
    href: process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "/health") ?? "http://localhost:8080/health",
  },
  {
    label: "Frontend Health",
    href: "/api/health",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Foundation Ready
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
          CollabCode
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Phase 1 scaffold for the Next.js frontend, Spring Boot backend, Node sync service, PostgreSQL, Redis, Docker Compose, and CI.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {serviceLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
