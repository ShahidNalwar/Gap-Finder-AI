import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const { confirmation } = await searchParams;
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-slate-950 px-8 py-10 text-white lg:min-h-screen lg:px-16 lg:py-12">
        <a href="/login" className="text-xl font-bold tracking-tight">GapFinder <span className="text-teal-300">AI</span></a>
        <div className="max-w-lg py-14 lg:py-20">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.22em] text-teal-300">Less guessing. Better revision.</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Find what you<br />don&apos;t know.<br /><span className="text-teal-300">Focus on what matters.</span></h1>
          <p className="mt-6 max-w-sm leading-7 text-slate-300">Turn your syllabus, notes, and past papers into a clear picture of your knowledge gaps—and a plan to close them.</p>
        </div>
        <p className="text-sm text-slate-400">Your material. Grounded questions. A clearer way forward.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">Your study workspace</p>
          <h2 className="text-3xl font-bold tracking-tight">Start with clarity.</h2>
          <p className="mb-8 mt-3 leading-6 text-slate-500">Sign in or create an account to keep your study progress in one place.</p>
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
