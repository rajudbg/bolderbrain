import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-md text-center">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">That route does not exist or was moved.</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
