import type { SavedPlan } from "@/lib/plans/schema";
import type { Report } from "@/lib/reports/build";

function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(new Date(value));
}

export function RevisionSheet({ plan, report }: { plan: SavedPlan; report: Report }) {
  const allocated = plan.data.items.reduce((total, item) => total + item.minutes, 0);
  return <article className="revision-sheet mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
    <div className="revision-sheet-heading border-b-2 border-teal-800 pb-6">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-800">GapFinder AI · Personal study checklist</p>
      <h1 className="mt-3 text-3xl font-bold">My Revision Sheet</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {plan.days} {plan.days === 1 ? "day" : "days"} · {plan.hours_per_day} {plan.hours_per_day === 1 ? "hour" : "hours"}/day · {allocated} scheduled minutes
        {plan.data.unallocatedMinutes > 0 ? ` · ${plan.data.unallocatedMinutes} minutes unallocated` : ""}
      </p>
      <p className="mt-2 text-xs leading-6 text-slate-500">Plan saved: {date(plan.created_at)} UTC<br />Diagnostic submitted: {date(report.submittedAt)} UTC · Attempt {report.attemptId.slice(0, 8)} · Plan {plan.id.slice(0, 8)}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">Work through the daily checklist, use the study guides below, then retake the diagnostic. This is a snapshot; save a new sheet after your plan changes.</p>
      <p className="mt-2 text-xs text-slate-500 print:hidden">Tick boxes here or on paper. Checkmarks on this page are not saved to your account.</p>
    </div>

    <section className="mt-8" aria-labelledby="sheet-daily-heading">
      <h2 id="sheet-daily-heading" className="text-xl font-bold">Daily checklist</h2>
      {!plan.data.items.length && <p className="mt-4 text-sm text-slate-600">No topics are scheduled in this plan. Complete a diagnostic and update your plan.</p>}
      {Array.from({ length: plan.days }, (_, index) => index + 1).map((day) => {
        const blocks = plan.data.items.flatMap((item, topicIndex) => item.schedule
          .filter((block) => block.day === day).map((block) => ({ item, topicIndex, minutes: block.minutes })));
        const minutes = blocks.reduce((total, block) => total + block.minutes, 0);
        if (!blocks.length) return null;
        return <section key={day} className="revision-day mt-5 rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold">Day {day} <span className="font-normal text-slate-500">· {minutes} minutes</span></h3>
          <ul className="mt-4 space-y-4">{blocks.map(({ item, topicIndex, minutes: blockMinutes }) => {
            const sections = [...new Set(report.reviews.filter((review) => review.topic_id === item.topicId).map((review) => review.section))];
            return <li key={item.topicId} className="revision-checklist-row flex items-start gap-3">
              <input className="revision-check" type="checkbox" aria-label={`Day ${day}: ${item.name}, ${blockMinutes} minutes complete`} />
              <div><p className="text-sm font-semibold">{item.name} · {blockMinutes} minutes</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Follow Study guide {topicIndex + 1} below.{sections.length ? ` Review: ${sections.join("; ")}.` : ""}</p>
              </div>
            </li>;
          })}</ul>
        </section>;
      })}
    </section>

    <section className="mt-10" aria-labelledby="sheet-guides-heading">
      <h2 id="sheet-guides-heading" className="text-xl font-bold">What to learn again</h2>
      {plan.data.items.map((item, index) => {
        const score = report.scores.find((topic) => topic.id === item.topicId);
        const reviews = report.reviews.filter((review) => review.topic_id === item.topicId)
          .sort((a, b) => Number(a.isCorrect) - Number(b.isCorrect));
        return <section key={item.topicId} className="revision-study-guide mt-7 border-t border-slate-200 pt-6">
          <h3 className="text-lg font-bold">Study guide {index + 1}: {item.name}</h3>
          <p className="mt-2 text-sm text-slate-600">Mastery {Math.round(item.mastery * 100)}%{score ? ` · ${score.label}` : ""} · {item.minutes} minutes · priority {item.priority.toFixed(2)}</p>
          {score && <p className="mt-3 text-sm leading-6 text-slate-600"><strong>Your gaps:</strong> {score.reason}</p>}
          <h4 className="mt-5 text-sm font-bold">Revision actions</h4>
          {item.tips.length ? <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6">{item.tips.map((tip, tipIndex) => <li key={tipIndex}>{tip}</li>)}</ul>
            : <p className="mt-3 text-sm leading-6 text-slate-600">No source-based tips were saved. Use the diagnostic explanations and source quotes below to review this topic.</p>}
          <h4 className="mt-5 text-sm font-bold">Diagnostic questions to revisit</h4>
          {!reviews.length && <p className="mt-3 text-sm text-slate-600">No question details are available for this topic.</p>}
          {reviews.map((review) => <div key={review.id} className="revision-question mt-4 rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {review.isCorrect ? review.confidence === "guessing" ? "Correct, but guessed — revisit" : "Correct — reinforce" : review.confidence === "sure" ? "Blind spot — sure, but wrong" : "Incorrect — revisit"}
            </p>
            <p className="mt-2 text-sm font-bold leading-6">{review.question}</p>
            <p className="mt-3 text-sm leading-6"><strong>Your answer:</strong> {review.options[review.selectedIndex]}</p>
            <p className="mt-1 text-sm leading-6"><strong>Correct answer:</strong> {review.options[review.correct_index]}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{review.explanation}</p>
            {!review.isCorrect && review.misconceptions[review.selectedIndex] && <p className="mt-3 text-sm leading-6"><strong>Mistake to correct:</strong> {review.misconceptions[review.selectedIndex]}</p>}
            <p className="mt-4 text-sm font-semibold text-teal-800">Source: {review.section}</p>
            <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-teal-700 pl-4 text-sm leading-6 text-slate-600">{review.source_quote}</blockquote>
          </div>)}
        </section>;
      })}
    </section>
    <footer className="mt-8 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-500">
      Compiled from your saved plan, submitted answers, and cited material. No additional AI generation was used to create this sheet.
    </footer>
  </article>;
}
