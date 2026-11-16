import { Citation } from "@/components/citation";
import type { Report } from "@/lib/reports/build";
import { Icon } from "@/components/ui/icon";

export function AnswerReview({ reviews }: { reviews: Report["reviews"] }) {
  return (
    <section className="mt-10 space-y-5">
      <div className="flex items-center gap-3"><span className="icon-tile"><Icon name="book" /></span><div><h2 className="text-xl font-semibold tracking-tight text-slate-900">Your answers, explained</h2><p className="mt-1 text-xs text-slate-400">The reasoning, the misconception, and the source.</p></div></div>
      {reviews.map((question, index) => <article key={question.id} className="surface p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${question.isCorrect ? "bg-teal-50 text-teal-800" : "bg-rose-50 text-rose-700"}`}><Icon name={question.isCorrect ? "check" : "alert"} className="h-3 w-3" />{question.isCorrect ? "Correct" : "Incorrect"}</span>
          <span className="text-[11px] text-slate-400">{question.confidence === "sure" ? "Sure" : "Guessing"}{!question.isCorrect && question.confidence === "sure" ? " · Blind spot" : ""}<span className="mx-2 text-slate-200">/</span>{question.topic}</span>
        </div>
        <h3 className="font-semibold leading-7 text-slate-900"><span className="mr-2 text-slate-300">{String(index + 1).padStart(2, "0")}.</span>{question.question}</h3>
        <p className="mt-4 text-sm text-slate-600">Your answer: {question.options[question.selectedIndex]}</p>
        <p className="mt-2 text-sm font-semibold">Correct answer: {question.options[question.correct_index]}</p>
        <p className="mt-4 leading-7 text-slate-600">{question.explanation}</p>
        {!question.isCorrect && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">Misconception: {question.misconceptions[question.selectedIndex]}</p>}
        <Citation section={question.section} quote={question.source_quote} />
      </article>)}
    </section>
  );
}
