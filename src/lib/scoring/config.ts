export const SCORING = {
  correctSureCredit: 1,
  correctGuessCredit: 0.5,
  wrongCredit: 0,
  mediumThreshold: 0.4,
  strongThreshold: 0.7,
  blindSpotBoost: 0.5,
  minExamWeight: 1,
  minTopicMinutes: 15,
  maxDays: 60,
  maxHoursPerDay: 24,
} as const;
