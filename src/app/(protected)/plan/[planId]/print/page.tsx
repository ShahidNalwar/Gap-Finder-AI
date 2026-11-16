import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { loadRevisionSheet } from "@/lib/plans/sheet";
import { PrintControls } from "@/components/print-controls";
import { RevisionSheet } from "@/components/revision-sheet";

export const metadata = { title: "My Revision Sheet | GapFinder AI" };

export default async function PrintPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const user = await requireUser();
  const { planId } = await params;
  let sheet;
  try { sheet = await loadRevisionSheet(await createClient(), user.sub, planId); }
  catch (error) {
    if (!(error instanceof AppError)) throw error;
    return <section><h1 className="text-2xl font-bold">Couldn&apos;t load this revision sheet</h1><p role="alert" className="my-5 text-red-800">{error.message}</p><Link className="button-secondary" href="/plan">Back to plan</Link></section>;
  }
  return <div className="mx-auto max-w-4xl print:max-w-none">
    <div className="space-y-5 print:hidden">
      <Link className="text-sm font-semibold text-teal-800 underline" href={`/plan?attempt=${sheet.plan.attempt_id}`}>← Back to revision plan</Link>
      <PrintControls />
    </div>
    <RevisionSheet plan={sheet.plan} report={sheet.report} />
  </div>;
}
