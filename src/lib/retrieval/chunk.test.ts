import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("ignores empty pages", () => {
    expect(chunkText([{ page: 1, text: " \n " }])).toEqual([]);
  });
  it("uses page numbers when headings are absent", () => {
    expect(chunkText([{ page: 4, text: "Plants use sunlight." }])).toEqual([
      { content: "Plants use sunlight.", section: "page 4" },
    ]);
  });
  it("preserves chapter and section headings", () => {
    const result = chunkText([{ page: 1, text: "Chapter 1: Plants\nSection 1.2 Chlorophyll\nChlorophyll is a pigment.\nSection 1.3 Stomata\nStomata are pores." }]);
    expect(result[0].section).toBe("Chapter 1: Plants, Section 1.2 Chlorophyll");
    expect(result[1].section).toContain("Section 1.3");
    expect(result[1].content).not.toContain("pigment");
  });
  it("bounds long chunks and retains text at the end", () => {
    const chunks = chunkText([{ page: 1, text: "An example sentence with several words. ".repeat(80) + "Final unique sentence." }]);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((chunk) => chunk.content.length <= 800)).toBe(true);
    expect(chunks.at(-1)?.content).toContain("Final unique sentence.");
    const tailWords = chunks[0].content.slice(-60).split(" ").slice(1).join(" ");
    expect(chunks[1].content).toContain(tailWords);
  });
  it("handles a single long word without hanging", () => {
    const chunks = chunkText([{ page: 1, text: "x".repeat(2400) }]);
    expect(chunks.map((chunk) => chunk.content).join("")).toBe("x".repeat(2400));
  });
  it("does not overlap between pages", () => {
    const chunks = chunkText([{ page: 1, text: "First page." }, { page: 2, text: "Second page." }]);
    expect(chunks[1]).toEqual({ content: "Second page.", section: "page 2" });
  });
  it("preserves an outline-only syllabus when headings are its content", () => {
    const chunks = chunkText([{ page: 1, text: "1. Photosynthesis\n1.1 Raw materials and products\n2. Respiration\n2.1 Aerobic respiration" }], true);
    const text = chunks.map((chunk) => chunk.content).join("\n");
    expect(text).toContain("1. Photosynthesis");
    expect(text).toContain("1.1 Raw materials and products");
    expect(text).toContain("2. Respiration");
    expect(text).toContain("2.1 Aerobic respiration");
  });
});
