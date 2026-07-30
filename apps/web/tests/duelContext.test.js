import { describe, expect, it } from "vitest";
import { createInitialDuelState, duelReducer } from "../src/state/duelContext";
import { FORMATION_433, POSITION_BY_FAMILY, player } from "./fixtures";

function started() {
  return duelReducer(createInitialDuelState(), {
    type: "START_DUEL",
    formationA: FORMATION_433,
    formationB: FORMATION_433,
  });
}

function withReveal(state, squad) {
  return duelReducer(state, {
    type: "SPIN_COMBO",
    combo: { team: "TMA", season: 2023 },
    squad,
  });
}

describe("duel turn taking", () => {
  it("gives A the first pick of a reveal, then passes to B", () => {
    let state = withReveal(started(), [player(1, ["CM"]), player(2, ["CM"])]);
    expect(state.turn).toBe("A");

    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.filledA.cm1.player.id).toBe(1);
    expect(state.turn).toBe("B");
    expect(state.phase).toBe("drafting");
  });

  it("closes the reveal and returns to spinning once both sides have acted", () => {
    let state = withReveal(started(), [player(1, ["CM"]), player(2, ["CM"])]);
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 2 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm2" });

    expect(state.filledB.cm2.player.id).toBe(2);
    expect(state.phase).toBe("spinning");
    expect(state.turn).toBe("A");
    expect(state.reveals).toBe(1);
    expect(state.currentSquad).toBeNull();
  });

  it("shares one used-player pool across both sides", () => {
    let state = withReveal(started(), [player(1, ["CM"]), player(2, ["CM"])]);
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 2 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm2" });

    expect(state.usedPlayerIds.has(1)).toBe(true);
    expect(state.usedPlayerIds.has(2)).toBe(true);
  });

  it("records where each side's players came from", () => {
    let state = withReveal(started(), [player(1, ["CM"])]);
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.filledA.cm1).toEqual({
      player: expect.objectContaining({ id: 1 }),
      team: "TMA",
      season: 2023,
    });
  });

  it("lets a side pass without filling a slot", () => {
    let state = withReveal(started(), [player(1, ["GK"])]);
    state = duelReducer(state, { type: "PASS_TURN" });
    expect(state.turn).toBe("B");
    expect(Object.keys(state.filledA)).toHaveLength(0);
  });

  it("only completes when both XIs are full", () => {
    let state = started();
    let id = 101;

    for (const slot of FORMATION_433.slots) {
      const forA = player(id++, [POSITION_BY_FAMILY[slot.fam]]);
      const forB = player(id++, [POSITION_BY_FAMILY[slot.fam]]);
      state = withReveal(state, [forA, forB]);

      state = duelReducer(state, { type: "SELECT_PLAYER", playerId: forA.id });
      state = duelReducer(state, { type: "FILL_SLOT", slotId: slot.id });

      const isLastSlot = slot.id === FORMATION_433.slots[FORMATION_433.slots.length - 1].id;
      // After A's final pick the duel must NOT be over — B still has one to make.
      if (isLastSlot) expect(state.phase).toBe("drafting");

      state = duelReducer(state, { type: "SELECT_PLAYER", playerId: forB.id });
      state = duelReducer(state, { type: "FILL_SLOT", slotId: slot.id });
    }

    expect(state.phase).toBe("complete");
    expect(Object.keys(state.filledA)).toHaveLength(11);
    expect(Object.keys(state.filledB)).toHaveLength(11);
  });
});

describe("RESET", () => {
  it("returns to setup", () => {
    let state = withReveal(started(), [player(1, ["CM"])]);
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    expect(duelReducer(state, { type: "RESET" })).toEqual(createInitialDuelState());
  });
});
