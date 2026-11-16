import { describe, expect, it } from "vitest";
import { createPlan } from "./plan";
import type { TopicScore } from "./mastery";

function topic(id: string, priority: number, mastery = 0.2): TopicScore {
  return { id, name: id, priority, mastery, label: mastery >= 0.7 ? "strong" : mastery >= 0.4 ? "medium" : "weak", examWeight: 1, total: 2, correct: 0, blindSpots: 0, blindSpotShare: 0, reason: "", misconceptions: [] };
}

describe("createPlan", () => {
  it("fits the exact budget and orders by priority", () => {
    const plan = createPlan([topic("low", 1), topic("high", 3)], 2, 1);
    expect(plan.totalMinutes).toBe(120);
    expect(plan.items.map((item) => item.topicId)).toEqual(["high", "low"]);
    expect(plan.items.map((item) => item.minutes)).toEqual([90, 30]);
  });
  it("does not schedule strong topics while weak topics need time", () => {
    const plan = createPlan([topic("weak", 1), topic("strong", 0, 1)], 1, 1);
    expect(plan.items.map((item) => item.topicId)).toEqual(["weak"]);
  });
  it("uses strong topics when they are the only tested topics", () => {
    const plan = createPlan([topic("strong", 0, 1)], 1, 1);
    expect(plan.items[0].minutes).toBe(60);
  });
  it("includes only top priorities when the minimum won't fit everyone", () => {
    const plan = createPlan([topic("a", 3), topic("b", 2), topic("c", 1)], 1, 0.5);
    expect(plan.items.map((item) => item.topicId)).toEqual(["a", "b"]);
    expect(plan.items.every((item) => item.minutes >= 15)).toBe(true);
    expect(plan.items.reduce((sum, item) => sum + item.minutes, 0)).toBe(30);
  });
  it("honors the 15 minute minimum for low-priority included topics", () => {
    const plan = createPlan([topic("a", 100), topic("b", 1)], 1, 1);
    expect(plan.items.map((item) => item.minutes)).toEqual([45, 15]);
  });
  it("rejects insufficient and invalid budgets", () => {
    expect(() => createPlan([topic("a", 1)], 1, 0.1)).toThrow();
    expect(() => createPlan([topic("a", 1)], 0, 1)).toThrow();
    expect(() => createPlan([topic("a", 1)], 1.5, 1)).toThrow();
    expect(() => createPlan([topic("a", 1)], 1, Infinity)).toThrow();
  });
  it("handles integer rounding without losing minutes", () => {
    const plan = createPlan([topic("a", 1), topic("b", 1), topic("c", 1)], 1, 1 + 1 / 60);
    expect(plan.items.reduce((sum, item) => sum + item.minutes, 0)).toBe(61);
  });
  it("spreads work across days within daily capacity", () => {
    const plan = createPlan([topic("a", 3), topic("b", 2), topic("c", 1)], 3, 1);
    for (let day = 1; day <= 3; day++) {
      expect(plan.items.flatMap((item) => item.schedule).filter((block) => block.day === day).reduce((sum, block) => sum + block.minutes, 0)).toBe(60);
    }
    for (const item of plan.items) expect(item.schedule.reduce((sum, block) => sum + block.minutes, 0)).toBe(item.minutes);
  });
  it("returns rank changes and mastery deltas", () => {
    const previous = { items: [{ topicId: "b", mastery: 0.1 }, { topicId: "a", mastery: 0.2 }] };
    const plan = createPlan([topic("a", 3, 0.4), topic("b", 1, 0.6)], 1, 1, previous);
    expect(plan.items[0].change.rankChange).toBe(1);
    expect(plan.items[0].change.masteryDelta).toBeCloseTo(0.2);
    expect(plan.items[1].change.rankChange).toBe(-1);
  });
  it("doesn't invent a mastery value for untested topics", () => {
    const plan = createPlan([{ ...topic("a", 0), mastery: null, label: "untested" }], 1, 1);
    expect(plan.items).toEqual([]);
    expect(plan.unallocatedMinutes).toBe(60);
  });
  it("is deterministic for tied priorities", () => {
    const topics = [topic("b", 1), topic("a", 1)];
    expect(createPlan(topics, 1, 1)).toEqual(createPlan(topics, 1, 1));
    expect(topics[0].id).toBe("b");
  });
});
