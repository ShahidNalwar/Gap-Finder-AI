import Link from "next/link";
import type { SavedPlan } from "@/lib/plans/schema";
import { Icon } from "@/components/ui/icon";

export function RevisionPlan({ plan }: { plan: SavedPlan }) {
  return (
    <section className="mt-8 space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-teal-300"><Icon name="spark" className="h-3.5 w-3.5" />Built around your gaps</p><h2 className="text-2xl font-semibold tracking-tight">A plan with a purpose.</h2></div>
          {plan.attempt_id && <Link className="button-secondary !border-white/15 !bg-white/10 !text-white hover:!bg-white/20" href={`/plan/${plan.id}/print`} target="_blank" rel="noopener noreferrer"><Icon name="download" className="h-4 w-4" />Print / Save as PDF <span className="sr-only">(opens a new tab)</span></Link>}
        </div>
        <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Time budget</p><p className="mt-2 text-2xl font-semibold tracking-tight">{plan.data.totalMinutes}<span className="ml-1 text-xs font-normal text-slate-400">min</span></p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Study window</p><p className="mt-2 text-2xl font-semibold tracking-tight">{plan.days}<span className="ml-1 text-xs font-normal text-slate-400">days</span></p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Daily pace</p><p className="mt-2 text-2xl font-semibold tracking-tight">{plan.hours_per_day}<span className="ml-1 text-xs font-normal text-slate-400">hrs/day</span></p></div>
        </div>
        {plan.data.unallocatedMinutes > 0 && <p className="mt-2 text-sm text-amber-200">{plan.data.unallocatedMinutes} minutes unallocated: complete a diagnostic for more topics.</p>}
      </div>
      <div className="flex items-center gap-3 pb-1 pt-4"><h2 className="text-sm font-semibold text-slate-900">Your priorities, in order</h2><span className="h-px flex-1 bg-slate-200/70" /><span className="text-[11px] text-slate-400">{plan.data.items.length} topics</span></div>
      {plan.data.items.map((item, index) => <article key={item.topicId} className="surface p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${index === 0 ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span><div><h3 className="text-lg font-semibold tracking-tight text-slate-900">{item.name}</h3>{index === 0 && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-600">Start here</p>}</div></div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800"><Icon name="clock" className="h-3.5 w-3.5" />{item.minutes} minutes</span>
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-500">Mastery <strong className="font-semibold text-slate-600">{Math.round(item.mastery * 100)}%</strong> <span className="mx-2 text-slate-200">/</span> Priority <strong className="font-semibold text-slate-600">{item.priority.toFixed(2)}</strong>. Ranked by mastery, exam weight, and blind spots.</p>
        {item.change.masteryDelta !== null && <p className="mt-3 text-sm font-semibold text-teal-800">
          Mastery {item.change.masteryDelta >= 0 ? "+" : ""}{Math.round(item.change.masteryDelta * 100)} percentage points · {item.change.rankChange! > 0 ? `moved up ${item.change.rankChange}` : item.change.rankChange! < 0 ? `moved down ${-item.change.rankChange!}` : "same priority position"}
        </p>}
        {item.change.masteryDelta === null && <p className="mt-2 text-[11px] text-slate-400">New to this plan, or no previous plan for comparison.</p>}
        <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm leading-7 text-slate-600">{item.tips.map((tip, tipIndex) => <li className="flex items-start gap-3" key={tipIndex}><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-teal-600" /><span>{tip}</span></li>)}</ul>
        <div className="mt-6 flex flex-wrap gap-2">{item.schedule.map((block) => <span key={block.day} className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><Icon name="calendar" className="h-3.5 w-3.5 text-slate-400" />Day {block.day}<span className="font-semibold text-slate-700">{block.minutes} min</span></span>)}</div>
      </article>)}
    </section>
  );
}
