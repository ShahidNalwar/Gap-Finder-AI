import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildReport } from "@/lib/reports/build";
import { AppError } from "@/lib/api";
import { AnswerReview } from "@/components/answer-review";
import { GapReport } from "@/components/gap-report";
import { PageHeader } from "@/components/ui/page-header";

export default async function ReportPage({ params, searchParams }: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ planWarning?: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;
  const { planWarning } = await searchParams;
  const supabase = await createClient();
  let report;
  try { report = await buildReport(supabase, user.sub, attemptId); }
  catch (error) {
    if (!(error instanceof AppError)) throw error;
    return <section><h1 className="text-2xl font-bold">Couldn&apos;t load this report</h1><p role="alert" className="my-5 text-red-800">{error.message}</p><Link className="button-secondary" href="/quiz">Back to quiz</Link></section>;
  }
  return <section>
    <PageHeader eyebrow="Your diagnostic results" icon="target" badge="Clarity is the first step" title="Now you know where to focus." description="A clearer picture of what you understand, what needs practice, and the blind spots you might not have noticed." />
    {planWarning === "1" && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Your answers and diagnosis are saved. The automatic plan update couldn&apos;t finish; open Plan to retry.</p>}
    <p className="mt-5 text-sm text-slate-500"><strong className="font-semibold text-slate-800">{report.reviews.filter((question) => question.isCorrect).length} of {report.reviews.length} correct.</strong> Confidence-aware diagnosis uses more than accuracy alone.</p>
    <GapReport scores={report.scores} />
    <div className="mt-8 flex flex-wrap gap-4">
      <Link className="button-primary" href={`/plan?attempt=${report.attemptId}`}>Build my revision plan →</Link>
      <Link className="button-secondary" href="/quiz">Retake diagnostic</Link>
    </div>
    <AnswerReview reviews={report.reviews} />
  </section>;
}
