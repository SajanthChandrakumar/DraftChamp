import { describe, expect, it } from "vitest";
import {
  eligibleSlotLabels,
  hasUsablePick,
  isDraftComplete,
  openSlotsFor,
} from "../src/game/eligibility";
import { FORMATION_433, POSITION_BY_FAMILY, player } from "./fixtures";

function fullXi() {
  const filled = {};
  let id = 101;
  for (const slot of FORMATION_433.slots) {
    filled[slot.id] = player(id++, [POSITION_BY_FAMILY[slot.fam]]);
  }
  return filled;
}

describe("eligibleSlotLabels", () => {
  it("maps a listed position straight to its own slot label", () => {
    expect(eligibleSlotLabels(player(1, ["CM"]))).toEqual(new Set(["CM"]));
    expect(eligibleSlotLabels(player(2, ["CB", "ST"]))).toEqual(new Set(["CB", "ST"]));
  });

  it("does not widen a single listed position into the whole family", () => {
    const labels = eligibleSlotLabels(player(1, ["RM"]));
    expect(labels.has("CM")).toBe(false);
    expect(labels.has("RM")).toBe(true);
  });

  it("aliases positions with no dedicated slot onto their nearest slot", () => {
    expect(eligibleSlotLabels(player(1, ["CDM"]))).toEqual(new Set(["CM"]));
    expect(eligibleSlotLabels(player(2, ["CAM"]))).toEqual(new Set(["CM"]));
    expect(eligibleSlotLabels(player(3, ["LWB"]))).toEqual(new Set(["LB"]));
    expect(eligibleSlotLabels(player(4, ["RWB"]))).toEqual(new Set(["RB"]));
    expect(eligibleSlotLabels(player(5, ["CF"]))).toEqual(new Set(["ST"]));
  });
});

describe("openSlotsFor", () => {
  it("only offers slots matching the player's exact position", () => {
    const slots = openSlotsFor(player(1, ["CM"]), FORMATION_433, {});
    expect(slots).toHaveLength(3);
    expect(slots.every((s) => s.label === "CM")).toBe(true);
  });

  it("excludes a same-family slot the player cannot actually play", () => {
    const slots = openSlotsFor(player(1, ["RM"]), FORMATION_433, {});
    expect(slots).toHaveLength(0);
  });

  it("excludes slots that are already filled", () => {
    const all = openSlotsFor(player(1, ["CM"]), FORMATION_433, {});
    const filled = { [all[0].id]: player(2, ["CM"]) };
    const remaining = openSlotsFor(player(1, ["CM"]), FORMATION_433, filled);
    expect(remaining).toHaveLength(all.length - 1);
    expect(remaining.find((s) => s.id === all[0].id)).toBeUndefined();
  });

  it("gives a keeper exactly one slot", () => {
    const slots = openSlotsFor(player(1, ["GK"]), FORMATION_433, {});
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
    expect(hasUsablePick(offered, FORMATION_433, filled, null)).toBe(false);
  });

  it("is false when the only offered player's exact position has no slot in this formation", () => {
    // FORMATION_433 has no RM slot at all, even though RM is a MID-family position.
    const offered = [player(2, ["RM"])];
    expect(hasUsablePick(offered, FORMATION_433, {}, null)).toBe(false);
  });

  it("is true when at least one offered player fits", () => {
    const offered = [player(2, ["GK"]), player(3, ["CM"])];
    expect(hasUsablePick(offered, FORMATION_433, { gk: player(1, ["GK"]) }, null)).toBe(true);
  });

  it("treats unaffordable players as unusable when a budget applies", () => {
    const offered = [player(2, ["CM"], { marketValue: 50 })];
    expect(hasUsablePick(offered, FORMATION_433, {}, 10)).toBe(false);
    expect(hasUsablePick(offered, FORMATION_433, {}, 100)).toBe(true);
  });

  it("ignores cost when there is no budget", () => {
    const offered = [player(2, ["CM"], { marketValue: 10_000_000 })];
    expect(hasUsablePick(offered, FORMATION_433, {}, null)).toBe(true);
  });
});
