import { describe, expect, it } from "vitest";
import { createInitialDraftState, draftReducer, type DraftState } from "../../src/state/draftContext";
import type { Player } from "../../src/leagues/types";

function player(id: number, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `Player ${id}`,
    positions: ["CM"],
    overall: 75,
    age: 25,
    attributes: { pace: 75, shooting: 75, passing: 75, dribbling: 75, defending: 75, physical: 75 },
    ...overrides,
  };
}

function startedState(overrides: Partial<DraftState> = {}): DraftState {
  const base = draftReducer(createInitialDraftState(), {
    type: "START_SESSION",
    formationId: "4-3-3",
    mode: "classic",
  });
  return { ...base, ...overrides };
}

describe("draftReducer budget gating", () => {
  it("fills a slot and tracks spend when under budget", () => {
    let state = startedState({ budgetCap: 100, currentSquad: [player(1, { marketValue: 40 })] });
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    expect(state.filledSlots.cm1?.id).toBe(1);
    expect(state.budgetSpent).toBe(40);
  });

  it("refuses to fill a slot that would exceed the budget cap", () => {
    let state = startedState({ budgetCap: 30, currentSquad: [player(1, { marketValue: 40 })] });
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    expect(state.filledSlots.cm1).toBeUndefined();
    expect(state.budgetSpent).toBe(0);
  });

  it("treats players with no market value as free (classic/record-chase/peak-xi modes)", () => {
    let state = startedState({ budgetCap: null, currentSquad: [player(1)] });
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    expect(state.filledSlots.cm1?.id).toBe(1);
    expect(state.budgetSpent).toBe(0);
  });
});

describe("draftReducer START_SESSION", () => {
  it("carries mode-specific fields and resets prior session state", () => {
    const state = draftReducer(createInitialDraftState(), {
      type: "START_SESSION",
      formationId: "4-4-2",
      mode: "record-chase",
      targetRecordId: "most-points",
    });
    expect(state.formationId).toBe("4-4-2");
    expect(state.mode).toBe("record-chase");
    expect(state.targetRecordId).toBe("most-points");
    expect(state.phase).toBe("spinning");
    expect(state.filledSlots).toEqual({});
  });
});
