import { QuizRunner } from "@/components/quiz-runner";
import { PageHeader } from "@/components/ui/page-header";

export default function QuizPage() {
  return <section><PageHeader eyebrow="03 / Diagnostic quiz" icon="quiz" badge="Understanding over memorization" title="Find the gaps. Not just a score." description="A short diagnostic grounded in your notes. Answer honestly, tell us when you're guessing, and discover what needs another look." /><div className="mt-8"><QuizRunner /></div></section>;
}
