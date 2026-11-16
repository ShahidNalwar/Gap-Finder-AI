"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { publicQuestionSchema, type PublicQuestion } from "@/lib/ai/schemas";
import { requestJson } from "@/lib/http";
import { QuizGenerator } from "@/components/quiz-generator";
import { Citation } from "@/components/citation";

type Answer = { questionId: string; selectedIndex: number; confidence?: "sure" | "guessing" };
const startSchema = z.object({ attemptId: z.string(), questions: z.array(publicQuestionSchema) });

export function QuizRunner() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<{ attemptId: string; questions: PublicQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true); setError("");
    try {
      const result = await requestJson("/api/quiz/start", startSchema, { method: "POST" });
      setQuiz(result); setAnswers({}); setIndex(0);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't start quiz."); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!quiz) return;
    setBusy(true); setError("");
    try {
      const result = await requestJson("/api/quiz/submit", z.object({ attemptId: z.string() }), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: quiz.attemptId, answers: Object.values(answers) }),
      });
      router.push(`/report/${result.attemptId}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't submit quiz."); setBusy(false); }
  }
  const question = quiz?.questions[index];
  const answer = question ? answers[question.id] : undefined;
  const answered = quiz?.questions.filter((item) => answers[item.id]?.selectedIndex >= 0 && answers[item.id]?.confidence).length ?? 0;
  function choose(selectedIndex: number, confidence?: "sure" | "guessing") {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: {
      questionId: question.id, selectedIndex,
      confidence: confidence ?? current[question.id]?.confidence,
    } }));
  }

  return (
    <div className="space-y-6">
      {!quiz && <>
        <QuizGenerator />
        <button className="button-primary" onClick={start} disabled={busy}>{busy ? "Starting…" : "Start quiz with saved questions →"}</button>
      </>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {question && quiz && <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap justify-between gap-2 text-sm text-slate-500"><span>{question.topic}</span><span>Question {index + 1} / {quiz.questions.length} · {answered} complete</span></div>
        <h2 className="text-xl font-bold leading-8">{question.question}</h2>
        <fieldset className="mt-6 space-y-3" disabled={busy}>
          <legend className="sr-only">Choose an answer</legend>
          {question.options.map((option, optionIndex) => <label key={optionIndex} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${answer?.selectedIndex === optionIndex ? "border-teal-700 bg-teal-50" : "border-slate-200"}`}>
            <input className="mt-1 !w-auto" type="radio" name={`answer-${question.id}`} checked={answer?.selectedIndex === optionIndex} onChange={() => choose(optionIndex)} />
            <span>{option}</span>
          </label>)}
        </fieldset>
        <fieldset disabled={busy} className="mt-6">
          <legend className="mb-3 text-sm font-semibold">How confident are you? <span className="font-normal text-slate-500">(required)</span></legend>
          <div className="flex gap-3">{(["sure", "guessing"] as const).map((confidence) =>
            <button type="button" key={confidence} aria-pressed={answer?.confidence === confidence}
              className={answer?.confidence === confidence ? "button-primary" : "button-secondary"}
              onClick={() => choose(answer?.selectedIndex ?? -1, confidence)}>{confidence === "sure" ? "I'm sure" : "I'm guessing"}</button>)}</div>
        </fieldset>
        <Citation section={question.section} quote={question.source_quote} />
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <button className="button-secondary" disabled={busy || index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
          {index < quiz.questions.length - 1
            ? <button className="button-primary" disabled={busy || !answer?.confidence || answer.selectedIndex < 0} onClick={() => setIndex(index + 1)}>Next question →</button>
            : <button className="button-primary" disabled={busy || answered !== quiz.questions.length} onClick={submit}>{busy ? "Saving and evaluating…" : "Submit and find my gaps →"}</button>}
        </div>
      </section>}
      {!quiz && <p className="text-sm leading-6 text-slate-500">Correct + sure earns full credit; correct + guessing earns half. Wrong + sure reveals a blind spot. Progress within an unfinished quiz is not retained if you reload.</p>}
    </div>
  );
}
