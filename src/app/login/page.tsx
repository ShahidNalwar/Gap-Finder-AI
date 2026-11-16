import { LoginForm } from "@/components/login-form";
import { Icon } from "@/components/ui/icon";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const { confirmation } = await searchParams;
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-7 py-8 text-white sm:px-12 lg:min-h-screen lg:px-16 lg:py-10">
        <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full border border-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-10 top-[38%] h-52 w-52 rounded-full border border-teal-300/10" aria-hidden="true" />
        <a href="/login" className="relative flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-teal-200"><Icon name="spark" className="h-6 w-6" /></span><span className="text-xl font-semibold tracking-tight">GapFinder <span className="text-teal-300">AI</span></span></a>
        <div className="relative max-w-lg py-10 sm:py-14 lg:py-12">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-300/15 bg-teal-300/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-teal-200"><span className="h-1.5 w-1.5 rounded-full bg-teal-300" />Less guessing. Better revision.</p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-.045em] sm:text-5xl xl:text-6xl">Find what you<br />don&apos;t know.<br /><span className="text-teal-200">Focus on what<br className="hidden xl:block" /> matters.</span></h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">Your syllabus, notes, and past papers. A clear picture of your knowledge gaps. A practical plan to move forward.</p>
          <div className="mt-9 hidden max-w-sm grid-cols-3 gap-3 border-t border-white/10 pt-6 sm:grid">
            {[["01", "Bring your notes"], ["02", "Find your gaps"], ["03", "Revise with focus"]].map(([number, label]) => <div key={number}><p className="text-[10px] font-semibold tracking-widest text-teal-400">{number}</p><p className="mt-2 text-[11px] leading-5 text-slate-300">{label}</p></div>)}
          </div>
        </div>
        <p className="relative hidden items-center gap-2 text-[11px] text-slate-500 sm:flex"><Icon name="shield" className="h-3.5 w-3.5" />Grounded in your material. Built around you.</p>
      </section>
      <section className="flex items-center justify-center bg-white/70 px-6 py-12 sm:py-16">
        <div className="w-full max-w-sm">
          <span className="icon-tile mb-6"><Icon name="book" /></span>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-teal-700">Your study workspace</p>
          <h2 className="text-3xl font-semibold tracking-[-.04em] text-slate-900">A clearer way forward.</h2>
          <p className="mb-8 mt-3 text-sm leading-7 text-slate-400">Sign in or create an account. Your material and progress will be right here.</p>
          {confirmation === "failed" && (
            <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              That confirmation link could not be verified. Try signing in, or request a new confirmation by signing up again.
            </p>
          )}
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
