import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadProgress } from "@/lib/progress";
import { AppError } from "@/lib/api";
import { ProgressChart } from "@/components/progress-chart";
import { PageHeader } from "@/components/ui/page-header";
import { Icon } from "@/components/ui/icon";

export default async function DashboardPage() {
  const user = await requireUser();
  let data;
  try { data = await loadProgress(await createClient(), user.sub); }
  catch (error) {
    if (!(error instanceof AppError)) throw error;
    return <section><h1 className="text-2xl font-bold">Progress dashboard</h1><p role="alert" className="mt-5 text-red-800">{error.message}</p></section>;
  }
  const latest = data.progress.at(-1);
  return <section>
    <PageHeader eyebrow="05 / Your progress" icon="dashboard" badge="Small steps. Real understanding." title="Look how far you've come." description="See your knowledge gaps get smaller, one attempt at a time. Confidence-aware mastery across your latest 20 submitted diagnostics." />
    {!latest ? <div className="surface mt-8 flex flex-col items-center px-6 py-14 text-center"><span className="icon-tile mb-5 !h-14 !w-14"><Icon name="dashboard" className="h-7 w-7" /></span><h2 className="text-xl font-semibold text-slate-900">Your progress story starts here.</h2><p className="mb-6 mt-3 max-w-sm text-sm leading-7 text-slate-400">Complete your first diagnostic to discover your gaps. Each retake adds another chapter to your progress.</p><Link className="button-primary" href="/quiz">Take a diagnostic<Icon name="arrow" className="h-4 w-4" /></Link></div> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="surface p-6"><div className="flex items-center justify-between"><p className="muted-label">Attempts shown</p><Icon name="quiz" className="h-5 w-5 text-slate-300" /></div><p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">{data.progress.length}</p><p className="mt-3 text-xs text-slate-400">Each attempt is a new starting point.</p></div>
        <div className="surface !border-teal-100 !bg-teal-50/40 p-6"><div className="flex items-center justify-between"><p className="muted-label !text-teal-700/65">Strong topics</p><Icon name="check" className="h-5 w-5 text-teal-500" /></div><p className="mt-5 text-4xl font-semibold tracking-tight text-teal-900">{latest.scores.filter((score) => score.label === "strong").length}<span className="ml-2 text-base font-normal text-teal-700/50">/ {latest.scores.length}</span></p><p className="mt-3 text-xs text-teal-700/65">From your latest diagnostic.</p></div>
        <div className="surface p-6"><div className="flex items-center justify-between"><p className="muted-label">Blind spots</p><Icon name="target" className="h-5 w-5 text-amber-500" /></div><p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">{latest.scores.reduce((sum, score) => sum + score.blindSpots, 0)}</p><p className="mt-3 text-xs text-slate-400">Confidently wrong answers to revisit.</p></div>
      </div>
      <section className="surface mt-6 p-5 sm:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight text-slate-900">Understanding, over time.</h2><p className="mt-1 text-xs text-slate-400">Topic mastery, adjusted for confidence.</p></div><span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500">{data.progress.length} {data.progress.length === 1 ? "attempt" : "attempts"}</span></div><ProgressChart topics={data.topics} progress={data.progress} /></section>
      <section className="surface mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-semibold tracking-tight text-slate-900">Every attempt counts.</h2><p className="mt-1 text-xs text-slate-400">Open a report to revisit the details.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/70"><th className="px-6 py-4 text-[11px] font-semibold text-slate-400">Attempt</th>{data.topics.map((topic) => <th className="whitespace-nowrap px-4 py-4 text-[11px] font-semibold text-slate-400" key={topic.id}>{topic.name}</th>)}</tr></thead>
          <tbody>{data.progress.map((attempt, index) => <tr key={attempt.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
            <td className="whitespace-nowrap px-6 py-5"><Link className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 hover:underline" href={`/report/${attempt.id}`}><span className="text-slate-400">#{String(index + 1).padStart(2, "0")}</span>{new Date(attempt.submittedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</Link></td>
            {data.topics.map((topic) => { const score = attempt.scores.find((item) => item.id === topic.id); return <td className="px-4 py-5" key={topic.id}><span className={`inline-flex min-w-14 justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold ${score?.label === "strong" ? "bg-teal-50 text-teal-800" : score?.label === "medium" ? "bg-amber-50 text-amber-800" : score?.label === "weak" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-400"}`}>{score?.mastery === null || score?.mastery === undefined ? "Untested" : `${Math.round(score.mastery * 100)}%`}</span></td>; })}
          </tr>)}</tbody></table>
        </div>
      </section>
      <div className="mt-6 flex flex-wrap gap-4"><Link className="button-primary" href="/quiz">Retake diagnostic →</Link><Link className="button-secondary" href={`/report/${latest.id}`}>Latest gap report</Link></div>
    </>}
    {data.latestPlan && <section className="surface mt-8 p-6 sm:p-7"><div className="flex items-center gap-3"><span className="icon-tile"><Icon name="plan" /></span><div><h2 className="text-lg font-semibold tracking-tight text-slate-900">Keep the momentum.</h2><p className="mt-1 text-xs text-slate-400">Your latest revision priorities.</p></div></div><ol className="my-5 divide-y divide-slate-100">{data.latestPlan.data.items.slice(0, 3).map((item, index) => <li key={item.topicId} className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-slate-600"><span className="mr-3 text-xs text-slate-300">{String(index + 1).padStart(2, "0")}</span>{item.name}</span><span className="text-xs font-semibold text-teal-800">{item.minutes} min</span></li>)}</ol><Link className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 hover:underline" href={`/plan?attempt=${data.latestPlan.attempt_id}`}>Open revision plan<Icon name="arrow" className="h-4 w-4" /></Link></section>}
  </section>;
}
