import { describe, expect, it } from "vitest";
import {
  createInitialDraftState,
  draftReducer,
  nextScriptedCombo,
} from "../src/state/draftContext";
import { FORMATION_433 } from "./fixtures";

const SEQUENCE = [
  { team: "TMA", season: 2020 },
  { team: "TMB", season: 2021 },
  { team: "TMC", season: 2022 },
];

function startedDaily() {
  return draftReducer(createInitialDraftState(), {
    type: "START_SESSION",
    formation: FORMATION_433,
    mode: "daily",
    dailySequence: SEQUENCE,
    dailyDate: "2026-08-03",
  });
}

function spin(state) {
  return draftReducer(state, {
    type: "SPIN_COMBO",
    combo: nextScriptedCombo(state),
    squad: [],
  });
}

describe("START_SESSION with a daily sequence", () => {
  it("stores the sequence and date and starts at the first reveal", () => {
    const state = startedDaily();
    expect(state.mode).toBe("daily");
    expect(state.dailySequence).toEqual(SEQUENCE);
    expect(state.dailyDate).toBe("2026-08-03");
    expect(state.revealIndex).toBe(0);
  });

  it("leaves the sequence unset for the other modes", () => {
    const state = draftReducer(createInitialDraftState(), {
      type: "START_SESSION",
      formation: FORMATION_433,
      mode: "classic",
    });
    expect(state.dailySequence).toBeNull();
    expect(nextScriptedCombo(state)).toBeNull();
  });
});

describe("nextScriptedCombo", () => {
  it("walks the sequence in order as reveals are spun", () => {
    let state = startedDaily();
    const seen = [];
    for (let i = 0; i < SEQUENCE.length; i++) {
      seen.push(nextScriptedCombo(state));
      state = spin(state);
    }
    expect(seen).toEqual(SEQUENCE);
  });

  it("wraps around rather than running out of reveals", () => {
    // Skipped reveals still consume the sequence, so a long draft can walk
    // past the end — it has to keep producing combos deterministically.
    let state = startedDaily();
    for (let i = 0; i < SEQUENCE.length; i++) state = spin(state);
    expect(state.revealIndex).toBe(SEQUENCE.length);
    expect(nextScriptedCombo(state)).toEqual(SEQUENCE[0]);
  });

  it("is null when there is no sequence, so the caller spins at random", () => {
    expect(nextScriptedCombo(createInitialDraftState())).toBeNull();
    expect(nextScriptedCombo({ ...createInitialDraftState(), dailySequence: [] })).toBeNull();
  });

  it("gives the same combo until the reveal is actually spun", () => {
    const state = startedDaily();
    expect(nextScriptedCombo(state)).toEqual(nextScriptedCombo(state));
  });
});

describe("RESET", () => {
  it("clears the daily sequence along with everything else", () => {
    const state = draftReducer(startedDaily(), { type: "RESET" });
    expect(state.dailySequence).toBeNull();
    expect(state.dailyDate).toBeNull();
    expect(state.revealIndex).toBe(0);
  });
});
