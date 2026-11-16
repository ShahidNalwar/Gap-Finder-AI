import { SCORING } from "./config";

export type ScoredAnswer = {
  correct: boolean;
  confidence: "sure" | "guessing";
  misconception: string | null;
};
export type ScoredTopic = { id: string; name: string; weight: number };
export type MasteryLabel = "weak" | "medium" | "strong" | "untested";
export type TopicScore = {
  id: string; name: string; examWeight: number;
  mastery: number | null; label: MasteryLabel; total: number; correct: number;
  blindSpots: number; blindSpotShare: number; priority: number; reason: string;
  misconceptions: string[];
};

export function scoreTopic(topic: ScoredTopic, answers: ScoredAnswer[]): TopicScore {
  const total = answers.length;
  const correct = answers.filter((answer) => answer.correct).length;
  const blindSpots = answers.filter((answer) => !answer.correct && answer.confidence === "sure").length;
  const totalCredit = answers.reduce((credit, answer) => credit + (answer.correct
    ? answer.confidence === "sure" ? SCORING.correctSureCredit : SCORING.correctGuessCredit
    : SCORING.wrongCredit), 0);
  const mastery = total ? totalCredit / total : null;
  const label: MasteryLabel = mastery === null ? "untested" : mastery < SCORING.mediumThreshold ? "weak" : mastery < SCORING.strongThreshold ? "medium" : "strong";
  const blindSpotShare = total ? blindSpots / total : 0;
  const examWeight = Math.max(SCORING.minExamWeight, topic.weight);
  const priority = mastery === null ? 0 : (1 - mastery) * examWeight * (1 + SCORING.blindSpotBoost * blindSpotShare);
  const misconceptions = [...new Set(answers.filter((answer) => !answer.correct).map((answer) => answer.misconception).filter((text): text is string => !!text))];
  const correctGuesses = answers.filter((answer) => answer.correct && answer.confidence === "guessing").length;
  const reason = total
    ? `${total - correct} of ${total} answers were wrong; ${blindSpots} were marked sure. ${correctGuesses} correct answers were guesses (half credit).${misconceptions.length ? ` Misconceptions: ${misconceptions.join(" ")}` : ""}`
    : "Not tested in this attempt. No mastery estimate is available yet.";
  return { id: topic.id, name: topic.name, examWeight, mastery, label, total, correct, blindSpots, blindSpotShare, priority, reason, misconceptions };
}
