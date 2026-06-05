import { describe, expect, it } from "vitest";

import {
  boundNumber,
  buildPlan,
  buildPracticeItems,
  calculateDashboardStats,
  MAX_DAYS,
  MIN_DAYS,
  normalizeWord,
  parseWords,
} from "./wordready";

describe("wordready helpers", () => {
  it("parses comma and line separated words without duplicates", () => {
    expect(parseWords("Tomorrow, window\nTomorrow\n bookshelf ")).toEqual([
      "Tomorrow",
      "window",
      "bookshelf",
    ]);
  });

  it("keeps day values inside the countdown range", () => {
    expect(boundNumber(0, MIN_DAYS, MAX_DAYS)).toBe(1);
    expect(boundNumber(8, MIN_DAYS, MAX_DAYS)).toBe(8);
    expect(boundNumber(99, MIN_DAYS, MAX_DAYS)).toBe(10);
  });

  it("builds a review plan that ends with a mock test", () => {
    const plan = buildPlan(5);

    expect(plan).toHaveLength(5);
    expect(plan[0]).toMatchObject({ day: "Today", daysLeft: 5, mode: "sentences" });
    expect(plan[4]).toMatchObject({ day: "Test Day", daysLeft: 1, mode: "mock" });
  });

  it("caps the daily plan at ten days", () => {
    const plan = buildPlan(12);

    expect(plan).toHaveLength(10);
    expect(plan.at(-1)).toMatchObject({ label: "Mock Test", mode: "mock" });
  });

  it("creates practice prompts for non-sentence modes", () => {
    const items = buildPracticeItems("fill", ["Tomorrow"]);

    expect(items[0]).toMatchObject({
      type: "fill",
      word: "Tomorrow",
    });
    expect(items[0].prompt).toContain("_____");
  });

  it("calculates dashboard stats from mastered words and graded answers", () => {
    const stats = calculateDashboardStats({
      correctAnswers: 4,
      masteredKeys: new Set([normalizeWord("Tomorrow"), normalizeWord("Window")]),
      totalAnswers: 5,
      words: ["Tomorrow", "Window", "Bookshelf"],
    });

    expect(stats).toEqual({
      accuracy: 80,
      dayStreak: 2,
      wordsMastered: 2,
      wordsToLearn: 3,
    });
  });
});
