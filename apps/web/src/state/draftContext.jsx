import { createContext, useContext, useReducer } from "react";
import { isDraftComplete } from "../game/eligibility";

export function createInitialDraftState() {
  return {
    mode: "classic",
    formation: null,
    filled: {},
    usedPlayerIds: new Set(),
    currentCombo: null,
    currentSquad: null,
    selectedPlayerId: null,
    round: 1,
    phase: "picking-formation",
    budgetCap: null,
    budgetSpent: 0,
    peakClubCode: null,
    // Daily Draft replaces the random spin with a fixed run of reveals so
    // everyone playing that day gets the same eleven picks to work with.
    dailySequence: null,
    dailyDate: null,
    revealIndex: 0,
  };
}

/** The club-season the next spin lands on, or null when it should be random. */
export function nextScriptedCombo(state) {
  if (!state.dailySequence?.length) return null;
  return state.dailySequence[state.revealIndex % state.dailySequence.length];
}

/** The XI in the shape the API expects. */
export function toSlotAssignments(filled) {
  return Object.entries(filled).map(([slotId, entry]) => ({
    slotId,
    playerId: entry.player.id,
    team: entry.team,
    season: entry.season,
  }));
}

export function playersOf(filled) {
  return Object.fromEntries(Object.entries(filled).map(([slotId, e]) => [slotId, e.player]));
}

function findSelected(state) {
  if (state.selectedPlayerId == null) return null;
  if (state.currentCombo) {
    const fromSquad = state.currentSquad?.find((p) => p.id === state.selectedPlayerId);
    if (fromSquad) {
      return {
        player: fromSquad,
        team: state.currentCombo.team,
        season: state.currentCombo.season,
      };
    }
  }
  return Object.values(state.filled).find((e) => e.player.id === state.selectedPlayerId) ?? null;
}

export function draftReducer(state, action) {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...createInitialDraftState(),
        formation: action.formation,
        mode: action.mode,
        budgetCap: action.budgetCap ?? null,
        peakClubCode: action.peakClubCode ?? null,
        dailySequence: action.dailySequence ?? null,
        dailyDate: action.dailyDate ?? null,
        phase: "spinning",
      };

    case "SPIN_COMBO":
      return {
        ...state,
        currentCombo: action.combo,
        currentSquad: action.squad,
        selectedPlayerId: null,
        revealIndex: state.revealIndex + 1,
        phase: "drafting",
      };

    case "SELECT_PLAYER":
      return { ...state, selectedPlayerId: action.playerId };

    case "FILL_SLOT": {
      if (!state.formation) return state;
      const entry = findSelected(state);
      if (!entry) return state;
      if (state.filled[action.slotId]) return state;

      const cost = entry.player.marketValue ?? 0;
      if (state.budgetCap != null && state.budgetSpent + cost > state.budgetCap) return state;

      const filled = { ...state.filled, [action.slotId]: entry };
      const usedPlayerIds = new Set(state.usedPlayerIds);
      usedPlayerIds.add(entry.player.id);

      const complete = isDraftComplete(playersOf(filled), state.formation);

      return {
        ...state,
        filled,
        usedPlayerIds,
        budgetSpent: state.budgetSpent + cost,
        selectedPlayerId: null,
        currentCombo: null,
        currentSquad: null,
        round: Math.min(state.formation.slots.length, state.round + 1),
        phase: complete ? "complete" : "spinning",
      };
    }

    case "MOVE_PLAYER": {
      const entry = state.filled[action.fromSlotId];
      if (!entry) return state;
      if (state.filled[action.toSlotId]) return state;
      const filled = { ...state.filled };
      delete filled[action.fromSlotId];
      filled[action.toSlotId] = entry;
      return { ...state, filled, selectedPlayerId: null };
    }

    case "RESET":
      return createInitialDraftState();

    default:
      return state;
  }
}

const DraftStateContext = createContext(null);
const DraftDispatchContext = createContext(null);

export function DraftProvider({ children }) {
  const [state, dispatch] = useReducer(draftReducer, undefined, createInitialDraftState);
  return (
    <DraftStateContext.Provider value={state}>
      <DraftDispatchContext.Provider value={dispatch}>{children}</DraftDispatchContext.Provider>
    </DraftStateContext.Provider>
  );
}

export function useDraftState() {
  const ctx = useContext(DraftStateContext);
  if (!ctx) throw new Error("useDraftState must be used within a DraftProvider");
  return ctx;
}

export function useDraftDispatch() {
  const ctx = useContext(DraftDispatchContext);
  if (!ctx) throw new Error("useDraftDispatch must be used within a DraftProvider");
  return ctx;
}
