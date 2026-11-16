import { SCORING } from "./config";
import type { TopicScore } from "./mastery";

export type PreviousPlan = { items: { topicId: string; mastery: number }[] };
export type PlanItem = {
  topicId: string; name: string; mastery: number; priority: number; minutes: number;
  schedule: { day: number; minutes: number }[];
  tips: string[];
  change: { previousRank: number | null; rankChange: number | null; masteryDelta: number | null };
};
export type RevisionPlan = {
  days: number; hoursPerDay: number; totalMinutes: number; unallocatedMinutes: number;
  items: PlanItem[];
};

export function createPlan(scores: TopicScore[], days: number, hoursPerDay: number, previous?: PreviousPlan): RevisionPlan {
  if (!Number.isInteger(days) || days < 1 || days > SCORING.maxDays || !Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > SCORING.maxHoursPerDay) {
    throw new Error("Choose 1–60 days and up to 24 hours per day.");
  }
  const totalMinutes = Math.floor(days * hoursPerDay * 60 + 1e-8);
  if (totalMinutes < SCORING.minTopicMinutes) throw new Error("Allow at least 15 minutes for revision.");
  const tested = scores.filter((score) => score.mastery !== null);
  const needingWork = tested.filter((score) => score.label !== "strong");
  // Weak/medium topics can consume the entire budget. Strong topics get time only if none need work.
  const candidates = needingWork.length ? needingWork : tested;
  const included = [...candidates].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, Math.floor(totalMinutes / SCORING.minTopicMinutes));
  const allocations = included.map(() => 0);
  let remaining = totalMinutes;
  let pending = included.map((_, index) => index);

  while (pending.length) {
    const sum = pending.reduce((n, index) => n + included[index].priority, 0);
    const shares = pending.map((index) => ({ index, value: remaining * (sum > 0 ? included[index].priority / sum : 1 / pending.length) }));
    const below = shares.filter((share) => share.value < SCORING.minTopicMinutes);
    if (below.length) {
      below.forEach(({ index }) => { allocations[index] = SCORING.minTopicMinutes; remaining -= SCORING.minTopicMinutes; });
      pending = pending.filter((index) => !below.some((share) => share.index === index));
      continue;
    }
    shares.forEach(({ index, value }) => { allocations[index] = Math.floor(value); });
    const remainder = remaining - shares.reduce((n, share) => n + Math.floor(share.value), 0);
    shares.sort((a, b) => (b.value % 1) - (a.value % 1) || a.index - b.index);
    for (let i = 0; i < remainder; i++) allocations[shares[i % shares.length].index]++;
    pending = [];
  }

  let day = 1;
  let dayRemaining = hoursPerDay * 60;
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  const items: PlanItem[] = included.map((score, index) => {
    const schedule: PlanItem["schedule"] = [];
    let todo = allocations[index];
    while (todo > 1e-6 && day <= days) {
      const minutes = round(Math.min(todo, dayRemaining));
      if (minutes > 0) schedule.push({ day, minutes });
      todo = round(todo - minutes);
      dayRemaining = round(dayRemaining - minutes);
      if (dayRemaining < 1e-6) { day++; dayRemaining = hoursPerDay * 60; }
    }
    const previousIndex = previous?.items.findIndex((item) => item.topicId === score.id) ?? -1;
    const old = previousIndex >= 0 ? previous!.items[previousIndex] : null;
    return {
      topicId: score.id, name: score.name, mastery: score.mastery!, priority: score.priority,
      minutes: allocations[index], schedule, tips: [],
      change: {
        previousRank: old ? previousIndex + 1 : null,
        rankChange: old ? previousIndex - index : null,
        masteryDelta: old ? score.mastery! - old.mastery : null,
      },
    };
  });
  return { days, hoursPerDay, totalMinutes, unallocatedMinutes: totalMinutes - allocations.reduce((sum, n) => sum + n, 0), items };
}
