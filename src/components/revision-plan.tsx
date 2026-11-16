import Link from "next/link";
import type { SavedPlan } from "@/lib/plans/schema";

export function RevisionPlan({ plan }: { plan: SavedPlan }) {
  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Your priorities, in order</h2>
          {plan.attempt_id && <Link className="button-secondary" href={`/plan/${plan.id}/print`} target="_blank" rel="noopener noreferrer">Print / Save as PDF <span className="sr-only">(opens a new tab)</span></Link>}
        </div>
        <p className="mt-3 text-sm text-slate-300">{plan.data.totalMinutes} minutes available · {plan.days} days · {plan.hours_per_day} hours/day</p>
        {plan.data.unallocatedMinutes > 0 && <p className="mt-2 text-sm text-amber-200">{plan.data.unallocatedMinutes} minutes unallocated: complete a diagnostic for more topics.</p>}
      </div>
      {plan.data.items.map((item, index) => <article key={item.topicId} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">{index + 1}. {item.name}</h3>
          <span className="font-semibold text-teal-800">{item.minutes} minutes</span>
        </div>
        <p className="mt-3 text-sm text-slate-500">Mastery {Math.round(item.mastery * 100)}% · priority {item.priority.toFixed(2)}. Order uses mastery, exam weight, and blind spots—not AI opinion.</p>
        {item.change.masteryDelta !== null && <p className="mt-3 text-sm font-semibold text-teal-800">
          Mastery {item.change.masteryDelta >= 0 ? "+" : ""}{Math.round(item.change.masteryDelta * 100)} percentage points · {item.change.rankChange! > 0 ? `moved up ${item.change.rankChange}` : item.change.rankChange! < 0 ? `moved down ${-item.change.rankChange!}` : "same priority position"}
        </p>}
        {item.change.masteryDelta === null && <p className="mt-3 text-xs text-slate-500">New to this plan, or no previous plan for comparison.</p>}
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6 text-slate-600">{item.tips.map((tip, tipIndex) => <li key={tipIndex}>{tip}</li>)}</ul>
        <div className="mt-5 flex flex-wrap gap-2">{item.schedule.map((block) => <span key={block.day} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold">Day {block.day}: {block.minutes} min</span>)}</div>
      </article>)}
    </section>
  );
}
