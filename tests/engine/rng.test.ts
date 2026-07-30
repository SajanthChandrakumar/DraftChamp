import { describe, expect, it } from "vitest";
import { hashString, seededRng } from "../../src/engine/rng";

describe("hashString", () => {
  it("is deterministic for the same input", () => {
    expect(hashString("gk,cb1,cb2")).toBe(hashString("gk,cb1,cb2"));
  });

  it("differs for different input", () => {
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });
});

describe("seededRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const rng = seededRng(hashString("test"));
    for (let i = 0; i < 50; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
