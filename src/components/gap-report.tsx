import type { TopicScore } from "@/lib/scoring/mastery";
import { Icon } from "@/components/ui/icon";

const badges = {
  weak: "bg-red-50 text-red-800",
  medium: "bg-amber-50 text-amber-900",
  strong: "bg-teal-50 text-teal-800",
  untested: "bg-slate-100 text-slate-600",
};

export function GapReport({ scores }: { scores: TopicScore[] }) {
  const ordered = [...scores].sort((a, b) => b.priority - a.priority);
  const blind = scores.filter((score) => score.blindSpots > 0);
  const colors = { weak: "bg-rose-400", medium: "bg-amber-400", strong: "bg-teal-500", untested: "bg-slate-300" };
  return <>
    <div className="mt-8 flex flex-wrap gap-2">{(["weak", "medium", "strong"] as const).map((label) => <span key={label} className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${colors[label]}`} /><strong className="text-slate-700">{scores.filter((score) => score.label === label).length}</strong><span className="capitalize">{label}</span></span>)}</div>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      {ordered.map((score) => <article key={score.id} className="surface p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{score.name}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badges[score.label]}`}>{score.label}</span>
        </div>
        <p className="mb-3 mt-5 text-4xl font-semibold tracking-tight text-slate-900">{score.mastery === null ? "—" : `${Math.round(score.mastery * 100)}%`} <span className="text-xs font-normal tracking-normal text-slate-400">mastery</span></p>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className={`h-full rounded-full ${colors[score.label]}`} style={{ width: `${(score.mastery ?? 0) * 100}%` }} /></div>
        <p className="text-sm leading-7 text-slate-600">{score.reason}</p>
        <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] text-slate-400">Exam weight <strong className="font-semibold text-slate-600">{score.examWeight}</strong> <span className="mx-2 text-slate-200">/</span> Revision priority <strong className="font-semibold text-slate-600">{score.priority.toFixed(2)}</strong></p>
      </article>)}
    </div>
    <section className="mt-8 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-6">
      <h2 className="flex items-center gap-3 text-lg font-semibold text-amber-950"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Icon name="alert" className="h-5 w-5" /></span>Blind spots: sure, but wrong</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">These are gaps you may not have noticed. Confidence is useful information, not a penalty.</p>
      {blind.length ? <ul className="mt-4 list-inside list-disc space-y-2 text-sm">{blind.map((score) => <li key={score.id}>{score.name}: {score.blindSpots} confidently wrong {score.blindSpots === 1 ? "answer" : "answers"}</li>)}</ul> : <p className="mt-4 text-sm">No confidently wrong answers in this attempt.</p>}
    </section>
  </>;
}
