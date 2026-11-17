export default function DocumentLoading() {
  return <section aria-busy="true" aria-label="Loading document" className="space-y-6">
    <p role="status" className="flex items-center gap-3 text-sm font-semibold text-teal-800">
      <span className="navigation-spinner h-5 w-5" aria-hidden="true" />
      Opening your document…
    </p>
    <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="h-3 w-36 rounded bg-teal-100" />
        <div className="h-10 w-3/4 max-w-lg rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
      </div>
      {[0, 1, 2].map((item) => <div key={item} className="surface space-y-4 p-6 sm:p-8">
        <div className="h-4 w-1/3 rounded bg-teal-100" />
        <div className="h-4 rounded bg-slate-100" />
        <div className="h-4 rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
      </div>)}
    </div>
  </section>;
}
