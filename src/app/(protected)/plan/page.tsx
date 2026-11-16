import { PlanForm } from "@/components/plan-form";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ attempt?: string }> }) {
  const { attempt } = await searchParams;
  return <section><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">04 / Revision plan</p><h1 className="text-3xl font-bold">Know what to work on next.</h1><p className="mt-4 leading-7 text-slate-500">Your biggest, most exam-important gaps come first. Retaking a quiz updates the plan using your last time budget.</p><PlanForm attemptId={attempt} /></section>;
}
