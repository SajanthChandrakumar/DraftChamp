import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { Combo, Player, PlayerId } from "../leagues/types";
import type { FormationId, SlotId } from "../engine/formations";
import { isDraftComplete } from "../engine/formations";
import type { GameModeId } from "../engine/modes";

export type DraftPhase = "picking-formation" | "spinning" | "drafting" | "complete";

export interface DraftState {
  mode: GameModeId;
  formationId: FormationId | null;
  filledSlots: Record<SlotId, Player>;
  usedPlayerIds: Set<PlayerId>;
  usedCombos: Combo[];
  currentCombo: Combo | null;
  currentSquad: Player[] | null;
  selectedPlayerId: PlayerId | null;
  round: number; // 1..11
  phase: DraftPhase;
  /** Record Chase: which real PL record this session is trying to beat. */
  targetRecordId: string | null;
  /** Budget Draft: total budget and how much of it has been spent so far. */
  budgetCap: number | null;
  budgetSpent: number;
  /** Peak XI: the one club whose seasons the spin pool is restricted to. */
  peakClubCode: string | null;
}

export interface StartSessionPayload {
  formationId: FormationId;
  mode: GameModeId;
  targetRecordId?: string;
  budgetCap?: number;
  peakClubCode?: string;
}

export type DraftAction =
  | ({ type: "START_SESSION" } & StartSessionPayload)
  | { type: "SPIN_COMBO"; combo: Combo; squad: Player[] }
  | { type: "SELECT_PLAYER"; playerId: PlayerId | null }
  | { type: "FILL_SLOT"; slotId: SlotId }
  | { type: "MOVE_PLAYER"; fromSlotId: SlotId; toSlotId: SlotId }
  | { type: "RESET" };

export function createInitialDraftState(): DraftState {
  return {
    mode: "classic",
    formationId: null,
    filledSlots: {},
    usedPlayerIds: new Set(),
    usedCombos: [],
    currentCombo: null,
    currentSquad: null,
    selectedPlayerId: null,
    round: 1,
    phase: "picking-formation",
    targetRecordId: null,
    budgetCap: null,
    budgetSpent: 0,
    peakClubCode: null,
  };
}

function findSelectedPlayer(state: DraftState): Player | null {
  if (state.selectedPlayerId == null) return null;
  return (
    state.currentSquad?.find((p) => p.id === state.selectedPlayerId) ??
    Object.values(state.filledSlots).find((p) => p.id === state.selectedPlayerId) ??
    null
  );
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...createInitialDraftState(),
        formationId: action.formationId,
        mode: action.mode,
        targetRecordId: action.targetRecordId ?? null,
        budgetCap: action.budgetCap ?? null,
        peakClubCode: action.peakClubCode ?? null,
        phase: "spinning",
      };

    case "SPIN_COMBO":
      return {
        ...state,
        currentCombo: action.combo,
        currentSquad: action.squad,
        usedCombos: [...state.usedCombos, action.combo],
        selectedPlayerId: null,
        phase: "drafting",
      };

    case "SELECT_PLAYER":
      return { ...state, selectedPlayerId: action.playerId };

    case "FILL_SLOT": {
      if (!state.formationId) return state;
      const player = findSelectedPlayer(state);
      if (!player) return state;
      if (state.filledSlots[action.slotId]) return state;

      const cost = player.marketValue ?? 0;
      if (state.budgetCap != null && state.budgetSpent + cost > state.budgetCap) return state;

      const filledSlots = { ...state.filledSlots, [action.slotId]: player };
      const usedPlayerIds = new Set(state.usedPlayerIds);
      usedPlayerIds.add(player.id);
      const complete = isDraftComplete(filledSlots, state.formationId);

      return {
        ...state,
        filledSlots,
        usedPlayerIds,
        budgetSpent: state.budgetSpent + cost,
        selectedPlayerId: null,
        currentCombo: null,
        currentSquad: null,
        round: Math.min(11, state.round + 1),
        phase: complete ? "complete" : "spinning",
      };
    }

    case "MOVE_PLAYER": {
      const player = state.filledSlots[action.fromSlotId];
      if (!player) return state;
      if (state.filledSlots[action.toSlotId]) return state;
      const filledSlots = { ...state.filledSlots };
      delete filledSlots[action.fromSlotId];
      filledSlots[action.toSlotId] = player;
      return { ...state, filledSlots };
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
