import { describe, expect, it } from "vitest";
import {
  eligibleFamilies,
  hasUsablePick,
  isDraftComplete,
  openSlotsFor,
} from "../src/game/eligibility";
import type { Player } from "../src/api/types";
import { FORMATION_433, POS_TO_FAM, POSITION_BY_FAMILY, player } from "./fixtures";

function fullXi(): Record<string, Player> {
  const filled: Record<string, Player> = {};
  let id = 101;
  for (const slot of FORMATION_433.slots) {
    filled[slot.id] = player(id++, [POSITION_BY_FAMILY[slot.fam]]);
  }
  return filled;
}

describe("eligibleFamilies", () => {
  it("maps every listed position to its family", () => {
    expect(eligibleFamilies(player(1, ["CM", "CAM"]), POS_TO_FAM)).toEqual(new Set(["MID"]));
    expect(eligibleFamilies(player(2, ["CB", "ST"]), POS_TO_FAM)).toEqual(
      new Set(["DEF", "FWD"])
    );
  });
});

describe("openSlotsFor", () => {
  it("only offers slots in the player's families", () => {
    const slots = openSlotsFor(player(1, ["CM"]), FORMATION_433, {}, POS_TO_FAM);
    expect(slots).toHaveLength(3);
    expect(slots.every((s) => s.fam === "MID")).toBe(true);
  });

  it("excludes slots that are already filled", () => {
    const all = openSlotsFor(player(1, ["CM"]), FORMATION_433, {}, POS_TO_FAM);
    const filled = { [all[0].id]: player(2, ["CM"]) };
    const remaining = openSlotsFor(player(1, ["CM"]), FORMATION_433, filled, POS_TO_FAM);
    expect(remaining).toHaveLength(all.length - 1);
    expect(remaining.find((s) => s.id === all[0].id)).toBeUndefined();
  });

  it("gives a keeper exactly one slot", () => {
    const slots = openSlotsFor(player(1, ["GK"]), FORMATION_433, {}, POS_TO_FAM);
    expect(slots.map((s) => s.id)).toEqual(["gk"]);
  });
});

describe("isDraftComplete", () => {
  it("is false while any slot is empty", () => {
    expect(isDraftComplete({}, FORMATION_433)).toBe(false);
    const partial = fullXi();
    delete partial.rw;
    expect(isDraftComplete(partial, FORMATION_433)).toBe(false);
  });

  it("is true once every slot is filled", () => {
    expect(isDraftComplete(fullXi(), FORMATION_433)).toBe(true);
  });
});

describe("hasUsablePick", () => {
  it("is false when no offered player fits an open slot", () => {
    const filled = { gk: player(1, ["GK"]) };
    // Only keepers on offer, and the keeper slot is taken.
    const offered = [player(2, ["GK"]), player(3, ["GK"])];
    expect(hasUsablePick(offered, FORMATION_433, filled, POS_TO_FAM, null)).toBe(false);
  });

  it("is true when at least one offered player fits", () => {
    const offered = [player(2, ["GK"]), player(3, ["CM"])];
    expect(hasUsablePick(offered, FORMATION_433, { gk: player(1, ["GK"]) }, POS_TO_FAM, null)).toBe(
      true
    );
  });

  it("treats unaffordable players as unusable when a budget applies", () => {
    const offered = [player(2, ["CM"], { marketValue: 50 })];
    expect(hasUsablePick(offered, FORMATION_433, {}, POS_TO_FAM, 10)).toBe(false);
    expect(hasUsablePick(offered, FORMATION_433, {}, POS_TO_FAM, 100)).toBe(true);
  });

  it("ignores cost when there is no budget", () => {
    const offered = [player(2, ["CM"], { marketValue: 10_000_000 })];
    expect(hasUsablePick(offered, FORMATION_433, {}, POS_TO_FAM, null)).toBe(true);
  });
});
