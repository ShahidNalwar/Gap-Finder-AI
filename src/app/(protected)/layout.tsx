import { requireUser } from "@/lib/auth";
import { Navigation } from "@/components/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const claims = await requireUser();
  return (
    <>
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-white focus:p-4 print:hidden" href="#main">Skip to content</a>
      <Navigation email={typeof claims.email === "string" ? claims.email : "Signed in"} />
      <main id="main" className="workspace-main mx-auto max-w-6xl px-4 py-9 sm:px-8 sm:py-12 print:max-w-none print:p-0">{children}</main>
    </>
  );
}
