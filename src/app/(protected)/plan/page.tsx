import { PlanForm } from "@/components/plan-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ attempt?: string }> }) {
  const { attempt } = await searchParams;
  return <section><PageHeader eyebrow="04 / Revision plan" icon="plan" badge="A little direction goes a long way" title="Your next steps, made clear." description="Focus on your biggest, most exam-important gaps. Set your available time and get a practical plan that evolves with every attempt." /><PlanForm attemptId={attempt} /></section>;
}
