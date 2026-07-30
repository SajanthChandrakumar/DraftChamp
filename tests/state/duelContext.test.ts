import { describe, expect, it } from "vitest";
import { createInitialDuelState, duelReducer, type DuelState } from "../../src/state/duelContext";
import type { Player } from "../../src/leagues/types";

function player(id: number): Player {
  return {
    id,
    name: `Player ${id}`,
    positions: ["CM"],
    overall: 75,
    age: 25,
    attributes: { pace: 75, shooting: 75, passing: 75, dribbling: 75, defending: 75, physical: 75 },
  };
}

function started(): DuelState {
  return duelReducer(createInitialDuelState(), {
    type: "START_DUEL",
    formationA: "4-3-3",
    formationB: "4-3-3",
  });
}

describe("duelReducer", () => {
  it("gives A the first pick from a reveal, then hands the turn to B", () => {
    let state = started();
    state = duelReducer(state, { type: "SPIN_COMBO", combo: ["TMA", 2023], squad: [player(1), player(2)] });
    expect(state.turn).toBe("A");

    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    expect(state.filledSlotsA.cm1?.id).toBe(1);
    expect(state.turn).toBe("B");
  });

  it("prevents B from drafting a player A already took this reveal", () => {
    let state = started();
    state = duelReducer(state, { type: "SPIN_COMBO", combo: ["TMA", 2023], squad: [player(1), player(2)] });
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    // B tries to select the same player A just took — selecting it is harmless,
    // but FILL_SLOT must not find it in currentSquad-minus-used semantics.
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 2 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm2" });
    expect(state.filledSlotsB.cm2?.id).toBe(2);
    expect(state.usedPlayerIds.has(1)).toBe(true);
    expect(state.usedPlayerIds.has(2)).toBe(true);
  });

  it("returns to spinning once both sides have acted on a reveal", () => {
    let state = started();
    state = duelReducer(state, { type: "SPIN_COMBO", combo: ["TMA", 2023], squad: [player(1), player(2)] });
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 2 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "cm2" });

    expect(state.phase).toBe("spinning");
    expect(state.reveals).toBe(1);
    expect(state.turn).toBe("A");
    expect(state.currentSquad).toBeNull();
  });

  it("supports passing a turn with no eligible player, without filling a slot", () => {
    let state = started();
    state = duelReducer(state, { type: "SPIN_COMBO", combo: ["TMA", 2023], squad: [player(1)] });
    state = duelReducer(state, { type: "PASS_TURN" });
    expect(state.turn).toBe("B");
    expect(Object.keys(state.filledSlotsA)).toHaveLength(0);
  });

  it("only completes once both formations are fully filled", () => {
    let state: DuelState = {
      ...started(),
      filledSlotsA: {
        gk: player(90),
        lb: player(91),
        cb1: player(92),
        cb2: player(93),
        rb: player(94),
        cm1: player(95),
        cm2: player(96),
        cm3: player(97),
        lw: player(98),
        st: player(99),
        // rw missing
      },
    };
    state = duelReducer(state, { type: "SPIN_COMBO", combo: ["TMA", 2023], squad: [player(1), player(2)] });
    state = duelReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = duelReducer(state, { type: "FILL_SLOT", slotId: "rw" });
    expect(state.turn).toBe("B");
    expect(state.phase).toBe("drafting");
  });
});
