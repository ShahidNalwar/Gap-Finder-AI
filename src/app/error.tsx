"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-6 py-20">
      <h1 className="text-2xl font-bold">We couldn&apos;t load this page</h1>
      <p className="text-slate-600">Please try again. If this keeps happening, check your connection and Supabase configuration.</p>
      <button className="button-primary" onClick={reset}>Try again</button>
    </main>
  );
}
