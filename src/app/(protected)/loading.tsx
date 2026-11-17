export default function WorkspaceLoading() {
  return <section aria-busy="true" aria-label="Loading page" className="space-y-8">
    <div role="status" className="flex items-center gap-3 text-sm font-semibold text-teal-800">
      <span className="navigation-spinner h-5 w-5" aria-hidden="true" />
      Loading your study page…
    </div>
    <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="h-3 w-36 rounded bg-teal-100" />
        <div className="h-10 w-3/4 max-w-lg rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1].map((item) => <div key={item} className="surface space-y-5 p-7">
          <div className="h-11 w-11 rounded-xl bg-teal-100" />
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 w-4/5 rounded bg-slate-100" />
          <div className="h-11 w-40 rounded-xl bg-teal-100" />
        </div>)}
      </div>
    </div>
  </section>;
}
