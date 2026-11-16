import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadProgress } from "@/lib/progress";
import { AppError } from "@/lib/api";
import { ProgressChart } from "@/components/progress-chart";

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
    <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">05 / Your progress</p>
    <h1 className="text-3xl font-bold">Watch your gaps get smaller.</h1>
    <p className="mt-4 leading-7 text-slate-500">Confidence-aware mastery across your latest 20 submitted attempts.</p>
    {!latest ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8"><p className="mb-5 text-slate-500">Complete your first diagnostic to see your progress here.</p><Link className="button-primary" href="/quiz">Take a diagnostic →</Link></div> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">Submitted attempts shown</p><p className="mt-3 text-3xl font-bold">{data.progress.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">Strong topics, latest attempt</p><p className="mt-3 text-3xl font-bold">{latest.scores.filter((score) => score.label === "strong").length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">Blind spots, latest attempt</p><p className="mt-3 text-3xl font-bold">{latest.scores.reduce((sum, score) => sum + score.blindSpots, 0)}</p></div>
      </div>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="mb-6 text-xl font-bold">Topic mastery over time</h2><ProgressChart topics={data.topics} progress={data.progress} /></section>
      <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-xl font-bold">Attempt history</h2>
        <table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="p-3">Attempt</th>{data.topics.map((topic) => <th className="p-3" key={topic.id}>{topic.name}</th>)}</tr></thead>
          <tbody>{data.progress.map((attempt, index) => <tr key={attempt.id} className="border-b border-slate-100">
            <td className="whitespace-nowrap p-3"><Link className="font-semibold text-teal-800 underline" href={`/report/${attempt.id}`}>#{index + 1} · {new Date(attempt.submittedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</Link></td>
            {data.topics.map((topic) => { const score = attempt.scores.find((item) => item.id === topic.id); return <td className="p-3" key={topic.id}>{score?.mastery === null || score?.mastery === undefined ? "Untested" : `${Math.round(score.mastery * 100)}%`}</td>; })}
          </tr>)}</tbody></table>
      </section>
      <div className="mt-6 flex flex-wrap gap-4"><Link className="button-primary" href="/quiz">Retake diagnostic →</Link><Link className="button-secondary" href={`/report/${latest.id}`}>Latest gap report</Link></div>
    </>}
    {data.latestPlan && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Latest revision priorities</h2><ol className="my-4 list-inside list-decimal space-y-2">{data.latestPlan.data.items.slice(0, 3).map((item) => <li key={item.topicId}>{item.name} · {item.minutes} min</li>)}</ol><Link className="text-sm font-semibold text-teal-800 underline" href={`/plan?attempt=${data.latestPlan.attempt_id}`}>Open revision plan →</Link></section>}
  </section>;
}
