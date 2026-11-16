import { requireUser } from "@/lib/auth";
import { Navigation } from "@/components/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const claims = await requireUser();
  return (
    <>
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-white focus:p-4" href="#main">Skip to content</a>
      <Navigation email={typeof claims.email === "string" ? claims.email : "Signed in"} />
      <main id="main" className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </>
  );
}
