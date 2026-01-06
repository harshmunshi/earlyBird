import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center px-6 h-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mr-8 flex items-center font-bold text-lg">
          Earlybird
        </div>
        <div className="flex-1" />
        <nav className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
        <section className="max-w-3xl space-y-6">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent pb-2">
            Track costs. <br /> Stay lean.
          </h1>
          <p className="text-lg text-muted-foreground max-w-[42rem] mx-auto">
            Earlybird helps early-stage startups manage project costs, upload bills, and split expenses effortlessly.
            Simple, beautiful, and transparent.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for startups.
          </p>
        </div>
      </footer>
    </div>
  );
}
