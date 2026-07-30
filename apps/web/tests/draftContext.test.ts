import { describe, expect, it } from "vitest";
import {
  createInitialDraftState,
  draftReducer,
  toSlotAssignments,
  type DraftState,
} from "../src/state/draftContext";
import { FORMATION_433, POSITION_BY_FAMILY, player } from "./fixtures";
import type { Player } from "../src/api/types";

function started(overrides: Partial<DraftState> = {}): DraftState {
  const base = draftReducer(createInitialDraftState(), {
    type: "START_SESSION",
    formation: FORMATION_433,
    mode: "classic",
  });
  return { ...base, ...overrides };
}

function withReveal(state: DraftState, squad: Player[]): DraftState {
  return draftReducer(state, {
    type: "SPIN_COMBO",
    combo: { team: "TMA", season: 2023 },
    squad,
  });
}

describe("START_SESSION", () => {
  it("stores the formation and mode and clears any prior draft", () => {
    const state = draftReducer(createInitialDraftState(), {
      type: "START_SESSION",
      formation: FORMATION_433,
      mode: "budget",
      budgetCap: 500,
      peakClubCode: null,
    });
    expect(state.formation?.id).toBe("4-3-3");
    expect(state.mode).toBe("budget");
    expect(state.budgetCap).toBe(500);
    expect(state.phase).toBe("spinning");
    expect(state.filled).toEqual({});
  });
});

describe("drafting", () => {
  it("records which club-season a player came from", () => {
    let state = withReveal(started(), [player(1, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.filled.cm1).toEqual({
      player: expect.objectContaining({ id: 1 }),
      team: "TMA",
      season: 2023,
    });
    expect(toSlotAssignments(state.filled)).toEqual([
      { slotId: "cm1", playerId: 1, team: "TMA", season: 2023 },
    ]);
  });

  it("clears the reveal and returns to spinning after a pick", () => {
    let state = withReveal(started(), [player(1, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.phase).toBe("spinning");
    expect(state.currentSquad).toBeNull();
    expect(state.currentCombo).toBeNull();
    expect(state.usedPlayerIds.has(1)).toBe(true);
    expect(state.round).toBe(2);
  });

  it("refuses to overwrite an occupied slot", () => {
    let state = withReveal(started(), [player(1, ["CM"]), player(2, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    state = withReveal(state, [player(2, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 2 });
    const after = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(after.filled.cm1.player.id).toBe(1);
  });

  it("completes once every slot is filled", () => {
    let state = started();
    let id = 101;
    for (const slot of FORMATION_433.slots) {
      const p = player(id++, [POSITION_BY_FAMILY[slot.fam]]);
      state = withReveal(state, [p]);
      state = draftReducer(state, { type: "SELECT_PLAYER", playerId: p.id });
      state = draftReducer(state, { type: "FILL_SLOT", slotId: slot.id });
    }
    expect(state.phase).toBe("complete");
    expect(toSlotAssignments(state.filled)).toHaveLength(11);
  });
});

describe("budget gating", () => {
  it("tracks spend when a pick is affordable", () => {
    let state = withReveal(started({ budgetCap: 100 }), [
      player(1, ["CM"], { marketValue: 40 }),
    ]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.filled.cm1.player.id).toBe(1);
    expect(state.budgetSpent).toBe(40);
  });

  it("refuses a pick that would exceed the cap", () => {
    let state = withReveal(started({ budgetCap: 30 }), [
      player(1, ["CM"], { marketValue: 40 }),
    ]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.filled.cm1).toBeUndefined();
    expect(state.budgetSpent).toBe(0);
  });

  it("treats players without a market value as free", () => {
    let state = withReveal(started({ budgetCap: null }), [player(1, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });

    expect(state.filled.cm1.player.id).toBe(1);
    expect(state.budgetSpent).toBe(0);
  });
});

describe("MOVE_PLAYER", () => {
  it("moves a placed player to an empty slot, keeping its origin", () => {
    let state = withReveal(started(), [player(1, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    state = draftReducer(state, { type: "MOVE_PLAYER", fromSlotId: "cm1", toSlotId: "cm2" });

    expect(state.filled.cm1).toBeUndefined();
    expect(state.filled.cm2).toEqual({
      player: expect.objectContaining({ id: 1 }),
      team: "TMA",
      season: 2023,
    });
  });

  it("refuses to move onto an occupied slot", () => {
    let state = withReveal(started(), [player(1, ["CM"]), player(2, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    state = withReveal(state, [player(2, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 2 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm2" });

    const after = draftReducer(state, {
      type: "MOVE_PLAYER",
      fromSlotId: "cm1",
      toSlotId: "cm2",
    });
    expect(after.filled.cm1.player.id).toBe(1);
    expect(after.filled.cm2.player.id).toBe(2);
  });
});

describe("RESET", () => {
  it("returns to a clean formation-picking state", () => {
    let state = withReveal(started(), [player(1, ["CM"])]);
    state = draftReducer(state, { type: "SELECT_PLAYER", playerId: 1 });
    state = draftReducer(state, { type: "FILL_SLOT", slotId: "cm1" });
    expect(draftReducer(state, { type: "RESET" })).toEqual(createInitialDraftState());
  });
});
