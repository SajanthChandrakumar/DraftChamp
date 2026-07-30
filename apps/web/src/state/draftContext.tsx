import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { Combo, Formation, GameModeId, Player, SlotAssignment } from "../api/types";
import { isDraftComplete } from "../game/eligibility";

export type DraftPhase = "picking-formation" | "spinning" | "drafting" | "complete";

/** A drafted player plus the club-season they came from, so the server can
 * look them up authoritatively when simulating. */
export interface DraftedPlayer {
  player: Player;
  team: string;
  season: number;
}

export interface DraftState {
  mode: GameModeId;
  formation: Formation | null;
  filled: Record<string, DraftedPlayer>;
  usedPlayerIds: Set<number>;
  currentCombo: Combo | null;
  currentSquad: Player[] | null;
  selectedPlayerId: number | null;
  round: number;
  phase: DraftPhase;
  budgetCap: number | null;
  budgetSpent: number;
  peakClubCode: string | null;
}

export type DraftAction =
  | {
      type: "START_SESSION";
      formation: Formation;
      mode: GameModeId;
      budgetCap?: number | null;
      peakClubCode?: string | null;
    }
  | { type: "SPIN_COMBO"; combo: Combo; squad: Player[] }
  | { type: "SELECT_PLAYER"; playerId: number | null }
  | { type: "FILL_SLOT"; slotId: string }
  | { type: "MOVE_PLAYER"; fromSlotId: string; toSlotId: string }
  | { type: "RESET" };

export function createInitialDraftState(): DraftState {
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
  };
}

/** The XI in the shape the API expects. */
export function toSlotAssignments(filled: Record<string, DraftedPlayer>): SlotAssignment[] {
  return Object.entries(filled).map(([slotId, entry]) => ({
    slotId,
    playerId: entry.player.id,
    team: entry.team,
    season: entry.season,
  }));
}

export function playersOf(filled: Record<string, DraftedPlayer>): Record<string, Player> {
  return Object.fromEntries(Object.entries(filled).map(([slotId, e]) => [slotId, e.player]));
}

function findSelected(state: DraftState): DraftedPlayer | null {
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

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...createInitialDraftState(),
        formation: action.formation,
        mode: action.mode,
        budgetCap: action.budgetCap ?? null,
        peakClubCode: action.peakClubCode ?? null,
        phase: "spinning",
      };

    case "SPIN_COMBO":
      return {
        ...state,
        currentCombo: action.combo,
        currentSquad: action.squad,
        selectedPlayerId: null,
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

const DraftStateContext = createContext<DraftState | null>(null);
const DraftDispatchContext = createContext<Dispatch<DraftAction> | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(draftReducer, undefined, createInitialDraftState);
  return (
    <DraftStateContext.Provider value={state}>
      <DraftDispatchContext.Provider value={dispatch}>{children}</DraftDispatchContext.Provider>
    </DraftStateContext.Provider>
  );
}

export function useDraftState(): DraftState {
  const ctx = useContext(DraftStateContext);
  if (!ctx) throw new Error("useDraftState must be used within a DraftProvider");
  return ctx;
}

export function useDraftDispatch(): Dispatch<DraftAction> {
  const ctx = useContext(DraftDispatchContext);
  if (!ctx) throw new Error("useDraftDispatch must be used within a DraftProvider");
  return ctx;
}
