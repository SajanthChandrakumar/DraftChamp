import { createContext, useContext, useReducer } from "react";
import { isDraftComplete } from "../game/eligibility";
import { playersOf } from "./draftContext";

export function createInitialDuelState() {
  return {
    phase: "setup",
    formationA: null,
    formationB: null,
    filledA: {},
    filledB: {},
    usedPlayerIds: new Set(),
    currentCombo: null,
    currentSquad: null,
    turn: "A",
    selectedPlayerId: null,
    reveals: 0,
  };
}

/** After the active side acts, hand over to the other side — or, once both
 * have acted on this reveal, close it out and set up the next spin. */
function advanceTurn(state) {
  if (state.turn === "A") {
    return { ...state, turn: "B", selectedPlayerId: null };
  }

  const bothComplete =
    !!state.formationA &&
    !!state.formationB &&
    isDraftComplete(playersOf(state.filledA), state.formationA) &&
    isDraftComplete(playersOf(state.filledB), state.formationB);

  return {
    ...state,
    turn: "A",
    selectedPlayerId: null,
    currentCombo: null,
    currentSquad: null,
    reveals: state.reveals + 1,
    phase: bothComplete ? "complete" : "spinning",
  };
}

export function duelReducer(state, action) {
  switch (action.type) {
    case "START_DUEL":
      return {
        ...createInitialDuelState(),
        formationA: action.formationA,
        formationB: action.formationB,
        phase: "spinning",
      };

    case "SPIN_COMBO":
      return {
        ...state,
        currentCombo: action.combo,
        currentSquad: action.squad,
        turn: "A",
        selectedPlayerId: null,
        phase: "drafting",
      };

    case "SELECT_PLAYER":
      return { ...state, selectedPlayerId: action.playerId };

    case "FILL_SLOT": {
      const formation = state.turn === "A" ? state.formationA : state.formationB;
      if (!formation || !state.currentSquad || !state.currentCombo) return state;

      const player = state.currentSquad.find((p) => p.id === state.selectedPlayerId);
      if (!player) return state;

      const filled = state.turn === "A" ? state.filledA : state.filledB;
      if (filled[action.slotId]) return state;

      const entry = {
        player,
        team: state.currentCombo.team,
        season: state.currentCombo.season,
      };
      const nextFilled = { ...filled, [action.slotId]: entry };
      const usedPlayerIds = new Set(state.usedPlayerIds);
      usedPlayerIds.add(player.id);

      return advanceTurn({
        ...state,
        usedPlayerIds,
        ...(state.turn === "A" ? { filledA: nextFilled } : { filledB: nextFilled }),
      });
    }

    case "PASS_TURN":
      return advanceTurn(state);

    case "RESET":
      return createInitialDuelState();

    default:
      return state;
  }
}

const DuelStateContext = createContext(null);
const DuelDispatchContext = createContext(null);

export function DuelProvider({ children }) {
  const [state, dispatch] = useReducer(duelReducer, undefined, createInitialDuelState);
  return (
    <DuelStateContext.Provider value={state}>
      <DuelDispatchContext.Provider value={dispatch}>{children}</DuelDispatchContext.Provider>
    </DuelStateContext.Provider>
  );
}

export function useDuelState() {
  const ctx = useContext(DuelStateContext);
  if (!ctx) throw new Error("useDuelState must be used within a DuelProvider");
  return ctx;
}

export function useDuelDispatch() {
  const ctx = useContext(DuelDispatchContext);
  if (!ctx) throw new Error("useDuelDispatch must be used within a DuelProvider");
  return ctx;
}
