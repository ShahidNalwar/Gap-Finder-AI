import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "../api";

vi.mock("server-only", () => ({}));
vi.mock("../api", () => ({
  AppError: class extends Error {
    constructor(message: string, public status = 400) { super(message); }
  },
  checkDb: (error: { message: string } | null) => {
    if (error) throw new Error(error.message);
  },
}));

import { DOCUMENT_PAGE_SIZE, loadDocumentView } from "./view";

const id = "11111111-1111-4111-8111-111111111111";
function database({ missing = false, error = false, empty = false } = {}) {
  const eq = vi.fn().mockReturnThis();
  const order = vi.fn().mockReturnThis();
  const range = vi.fn().mockResolvedValue({
    data: empty ? [] : [{ id, section: "Section 1", content: "<script>literal source text</script>" }],
    count: empty ? 0 : 50, error: error ? { message: "Database unavailable" } : null,
  });
  const ilike = vi.fn().mockReturnThis();
  const maybeSingle = vi.fn().mockResolvedValue({
    data: missing ? null : { id, name: "Sample Electricity v2: notes.txt", kind: "notes" }, error: null,
  });
  // Each fluent method returns this same builder, like the real PostgREST client.
  const builder = { eq, order, range, ilike, maybeSingle };
  const from = vi.fn(() => ({ select: vi.fn().mockReturnValue(builder) }));
  return { client: { from } as unknown as DbClient, from, ...builder };
}

describe("private document viewer", () => {
  it("scopes document and passage reads to the owner and selected document", async () => {
    const db = database();
    const result = await loadDocumentView(db.client, "student-a", { id });
    expect(db.eq.mock.calls).toEqual([
      ["user_id", "student-a"], ["id", id],
      ["user_id", "student-a"], ["document_id", id],
    ]);
    expect(db.range).toHaveBeenCalledWith(0, DOCUMENT_PAGE_SIZE - 1);
    expect(db.order.mock.calls).toEqual([["section", { ascending: true }], ["id", { ascending: true }]]);
    expect(result.total).toBe(50);
    expect(result.passages[0].content).toContain("<script>");
  });
  it("does not read chunks when the document is missing or invisible under RLS", async () => {
    const db = database({ missing: true });
    await expect(loadDocumentView(db.client, "student-b", { id })).rejects.toMatchObject({ status: 404 });
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.range).not.toHaveBeenCalled();
  });
  it("rejects invalid document IDs and pagination before querying", async () => {
    const db = database();
    for (const input of [{ id: "not-an-id" }, { id, page: "0" }, { id, page: "1.5" }, { id, page: "oops" }]) {
      await expect(loadDocumentView(db.client, "student", input)).rejects.toMatchObject({ status: 400 });
    }
    expect(db.from).not.toHaveBeenCalled();
  });
  it("paginates without silently truncating larger documents", async () => {
    const db = database();
    const result = await loadDocumentView(db.client, "student", { id, page: "2" });
    expect(db.range).toHaveBeenCalledWith(DOCUMENT_PAGE_SIZE, DOCUMENT_PAGE_SIZE * 2 - 1);
    expect(result.page).toBe(2);
    expect(result.offset).toBe(DOCUMENT_PAGE_SIZE);
  });
  it("escapes wildcard characters in literal document searches", async () => {
    const db = database();
    await loadDocumentView(db.client, "student", { id, query: "  50%_\\  " });
    expect(db.ilike).toHaveBeenCalledWith("content", "%50\\%\\_\\\\%");
  });
  it("supports an empty document or search result", async () => {
    const db = database({ empty: true });
    const result = await loadDocumentView(db.client, "student", { id });
    expect(result.passages).toEqual([]);
    expect(result.total).toBe(0);
  });
  it("surfaces failed passage reads rather than showing an empty success", async () => {
    const db = database({ error: true });
    await expect(loadDocumentView(db.client, "student", { id })).rejects.toThrow("Database unavailable");
  });
});
