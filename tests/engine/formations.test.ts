import { describe, expect, it } from "vitest";
import { isDraftComplete, openSlotsFor } from "../../src/engine/formations";
import type { Player } from "../../src/leagues/types";

function player(id: number, positions: Player["positions"]): Player {
  return {
    id,
    name: `Player ${id}`,
    positions,
    overall: 75,
    age: 25,
    attributes: { pace: 75, shooting: 75, passing: 75, dribbling: 75, defending: 75, physical: 75 },
  };
}

describe("openSlotsFor", () => {
  it("matches multi-position players to slots across their eligible families", () => {
    const midfielder = player(1, ["CM", "CAM"]);
    const slots = openSlotsFor(midfielder, "4-3-3", {});
    expect(slots.every((s) => s.fam === "MID")).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("excludes already-filled slots", () => {
    const midfielder = player(1, ["CM"]);
    const allSlots = openSlotsFor(midfielder, "4-3-3", {});
    const filledSlots = { [allSlots[0].id]: player(2, ["CM"]) };
    const remaining = openSlotsFor(midfielder, "4-3-3", filledSlots);
    expect(remaining.find((s) => s.id === allSlots[0].id)).toBeUndefined();
    expect(remaining.length).toBe(allSlots.length - 1);
  });

  it("returns no slots for a family the formation doesn't use in that spot", () => {
    const keeper = player(1, ["GK"]);
    const slots = openSlotsFor(keeper, "4-3-3", {});
    expect(slots).toHaveLength(1);
    expect(slots[0].fam).toBe("GK");
  });
});

describe("isDraftComplete", () => {
  it("is false until every slot is filled", () => {
    expect(isDraftComplete({}, "4-3-3")).toBe(false);
  });

  it("is true once every formation slot has a player", () => {
    const filled: Record<string, Player> = {};
    let id = 1;
    for (const slot of [
      "gk", "lb", "cb1", "cb2", "rb", "cm1", "cm2", "cm3", "lw", "st", "rw",
    ]) {
      filled[slot] = player(id++, ["ST"]);
    }
    expect(isDraftComplete(filled, "4-3-3")).toBe(true);
  });
});
