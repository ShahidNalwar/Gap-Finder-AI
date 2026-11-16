import { Citation } from "@/components/citation";
import type { Report } from "@/lib/reports/build";

export function AnswerReview({ reviews }: { reviews: Report["reviews"] }) {
  return (
    <section className="mt-10 space-y-5">
      <h2 className="text-2xl font-bold">Your answers, explained</h2>
      {reviews.map((question, index) => <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className={`mb-3 text-sm font-semibold ${question.isCorrect ? "text-teal-800" : "text-red-800"}`}>
          {question.isCorrect ? "Correct" : "Incorrect"} · {question.confidence === "sure" ? "Sure" : "Guessing"}{!question.isCorrect && question.confidence === "sure" ? " · Blind spot" : ""} · {question.topic}
        </p>
        <h3 className="font-bold leading-7">{index + 1}. {question.question}</h3>
        <p className="mt-4 text-sm text-slate-600">Your answer: {question.options[question.selectedIndex]}</p>
        <p className="mt-2 text-sm font-semibold">Correct answer: {question.options[question.correct_index]}</p>
        <p className="mt-4 leading-7 text-slate-600">{question.explanation}</p>
        {!question.isCorrect && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">Misconception: {question.misconceptions[question.selectedIndex]}</p>}
        <Citation section={question.section} quote={question.source_quote} />
      </article>)}
    </section>
  );
}
