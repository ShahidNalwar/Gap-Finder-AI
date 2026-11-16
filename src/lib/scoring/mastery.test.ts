import { describe, expect, it } from "vitest";
import { scoreTopic, type ScoredAnswer } from "./mastery";

const topic = { id: "topic-1", name: "Photosynthesis", weight: 3 };
const answer = (correct: boolean, confidence: "sure" | "guessing"): ScoredAnswer => ({ correct, confidence, misconception: correct ? null : "Confuses reactants and products." });

describe("scoreTopic", () => {
  it("awards full credit to correct sure answers", () => {
    const result = scoreTopic(topic, [answer(true, "sure"), answer(true, "sure")]);
    expect(result.mastery).toBe(1);
    expect(result.label).toBe("strong");
    expect(result.priority).toBe(0);
  });
  it("counts wrong sure answers as blind spots", () => {
    const result = scoreTopic(topic, [answer(false, "sure"), answer(false, "sure")]);
    expect(result.mastery).toBe(0);
    expect(result.blindSpots).toBe(2);
    expect(result.blindSpotShare).toBe(1);
    expect(result.priority).toBe(4.5);
    expect(result.reason).toContain("2 of 2");
    expect(result.reason).toContain("Confuses reactants");
  });
  it("gives half credit to correct guesses", () => {
    const result = scoreTopic(topic, [answer(true, "guessing")]);
    expect(result.mastery).toBe(0.5);
    expect(result.label).toBe("medium");
  });
  it("awards zero for wrong guesses without a blind spot", () => {
    const result = scoreTopic(topic, [answer(false, "guessing")]);
    expect(result.mastery).toBe(0);
    expect(result.blindSpots).toBe(0);
    expect(result.priority).toBe(3);
  });
  it("calculates mixed confidence credit and priority exactly", () => {
    const result = scoreTopic(topic, [answer(true, "sure"), answer(true, "guessing"), answer(false, "sure"), answer(false, "guessing")]);
    expect(result.mastery).toBe(0.375);
    expect(result.label).toBe("weak");
    expect(result.blindSpotShare).toBe(0.25);
    expect(result.priority).toBe(0.625 * 3 * 1.125);
  });
  it("labels the 0.4 boundary as medium", () => {
    expect(scoreTopic(topic, [answer(true, "sure"), answer(true, "sure"), ...Array.from({ length: 3 }, () => answer(false, "guessing"))]).label).toBe("medium");
  });
  it("labels the 0.7 boundary as strong", () => {
    expect(scoreTopic(topic, [...Array.from({ length: 7 }, () => answer(true, "sure")), ...Array.from({ length: 3 }, () => answer(false, "guessing"))]).label).toBe("strong");
  });
  it("keeps a topic without answers untested", () => {
    const result = scoreTopic(topic, []);
    expect(result.mastery).toBeNull();
    expect(result.label).toBe("untested");
    expect(result.priority).toBe(0);
  });
  it("uses a minimum exam weight of one", () => {
    expect(scoreTopic({ ...topic, weight: 0 }, [answer(false, "guessing")]).priority).toBe(1);
  });
});
