import Link from "next/link";

export function WorkspacePlaceholder({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <section>
      <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">{step}</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-500">{description}</p>
      <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">Workspace ready</span>
        <h2 className="mt-5 text-xl font-bold">One step at a time.</h2>
        <p className="mt-3 max-w-lg leading-7 text-slate-500">Your sign-in and protected workspace are set up. This feature will arrive in a later build slice; no study data has been loaded yet.</p>
        <Link href="/upload" className="mt-6 inline-block text-sm font-semibold text-teal-800 underline underline-offset-4">Start with your material →</Link>
      </div>
    </section>
  );
}
