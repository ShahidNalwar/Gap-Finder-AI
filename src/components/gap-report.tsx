import type { TopicScore } from "@/lib/scoring/mastery";

const badges = {
  weak: "bg-red-50 text-red-800",
  medium: "bg-amber-50 text-amber-900",
  strong: "bg-teal-50 text-teal-800",
  untested: "bg-slate-100 text-slate-600",
};

export function GapReport({ scores }: { scores: TopicScore[] }) {
  const ordered = [...scores].sort((a, b) => b.priority - a.priority);
  const blind = scores.filter((score) => score.blindSpots > 0);
  return <>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      {ordered.map((score) => <article key={score.id} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{score.name}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badges[score.label]}`}>{score.label}</span>
        </div>
        <p className="my-4 text-3xl font-bold">{score.mastery === null ? "—" : `${Math.round(score.mastery * 100)}%`} <span className="text-sm font-normal text-slate-500">mastery</span></p>
        <p className="text-sm leading-7 text-slate-600">{score.reason}</p>
        <p className="mt-4 text-xs text-slate-500">Exam weight {score.examWeight} · revision priority {score.priority.toFixed(2)}</p>
      </article>)}
    </div>
    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-xl font-bold">Blind spots: sure, but wrong</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">These are gaps you may not have noticed. Confidence is useful information, not a penalty.</p>
      {blind.length ? <ul className="mt-4 list-inside list-disc space-y-2 text-sm">{blind.map((score) => <li key={score.id}>{score.name}: {score.blindSpots} confidently wrong {score.blindSpots === 1 ? "answer" : "answers"}</li>)}</ul> : <p className="mt-4 text-sm">No confidently wrong answers in this attempt.</p>}
    </section>
  </>;
}
