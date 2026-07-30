import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { Combo, Player, PlayerId } from "../leagues/types";
import type { FormationId, SlotId } from "../engine/formations";
import { isDraftComplete } from "../engine/formations";

export type DuelPhase = "setup" | "spinning" | "drafting" | "complete";
export type DuelSide = "A" | "B";

export interface DuelState {
  phase: DuelPhase;
  formationA: FormationId | null;
  formationB: FormationId | null;
  filledSlotsA: Record<SlotId, Player>;
  filledSlotsB: Record<SlotId, Player>;
  usedPlayerIds: Set<PlayerId>;
  currentCombo: Combo | null;
  currentSquad: Player[] | null;
  turn: DuelSide;
  selectedPlayerId: PlayerId | null;
  reveals: number;
}

export type DuelAction =
  | { type: "START_DUEL"; formationA: FormationId; formationB: FormationId }
  | { type: "SPIN_COMBO"; combo: Combo; squad: Player[] }
  | { type: "SELECT_PLAYER"; playerId: PlayerId | null }
  | { type: "FILL_SLOT"; slotId: SlotId }
  | { type: "PASS_TURN" }
  | { type: "RESET" };

export function createInitialDuelState(): DuelState {
  return {
    phase: "setup",
    formationA: null,
    formationB: null,
    filledSlotsA: {},
    filledSlotsB: {},
    usedPlayerIds: new Set(),
    currentCombo: null,
    currentSquad: null,
    turn: "A",
    selectedPlayerId: null,
    reveals: 0,
  };
}

function filledSlotsFor(state: DuelState, side: DuelSide): Record<SlotId, Player> {
  return side === "A" ? state.filledSlotsA : state.filledSlotsB;
}

function formationFor(state: DuelState, side: DuelSide): FormationId | null {
  return side === "A" ? state.formationA : state.formationB;
}

/** After the active side acts (fill or pass), advance to the other side, or
 * close out this reveal once both have acted and set up the next spin. */
function advanceTurn(state: DuelState): DuelState {
  if (state.turn === "A") {
    return { ...state, turn: "B", selectedPlayerId: null };
  }

  const bothComplete =
    !!state.formationA &&
    !!state.formationB &&
    isDraftComplete(state.filledSlotsA, state.formationA) &&
    isDraftComplete(state.filledSlotsB, state.formationB);

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

export function duelReducer(state: DuelState, action: DuelAction): DuelState {
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
      const formationId = formationFor(state, state.turn);
      if (!formationId || !state.currentSquad) return state;
      const player = state.currentSquad.find((p) => p.id === state.selectedPlayerId);
      if (!player) return state;

      const filledSlots = filledSlotsFor(state, state.turn);
      if (filledSlots[action.slotId]) return state;

      const nextFilledSlots = { ...filledSlots, [action.slotId]: player };
      const usedPlayerIds = new Set(state.usedPlayerIds);
      usedPlayerIds.add(player.id);

      const withFill: DuelState = {
        ...state,
        usedPlayerIds,
        ...(state.turn === "A" ? { filledSlotsA: nextFilledSlots } : { filledSlotsB: nextFilledSlots }),
      };

      return advanceTurn(withFill);
    }

    case "PASS_TURN":
      return advanceTurn(state);

    case "RESET":
      return createInitialDuelState();

    default:
      return state;
  }
}

const DuelStateContext = createContext<DuelState | null>(null);
const DuelDispatchContext = createContext<Dispatch<DuelAction> | null>(null);

export function DuelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(duelReducer, undefined, createInitialDuelState);
  return (
    <DuelStateContext.Provider value={state}>
      <DuelDispatchContext.Provider value={dispatch}>{children}</DuelDispatchContext.Provider>
    </DuelStateContext.Provider>
  );
}

export function useDuelState(): DuelState {
  const ctx = useContext(DuelStateContext);
  if (!ctx) throw new Error("useDuelState must be used within a DuelProvider");
  return ctx;
}

export function useDuelDispatch(): Dispatch<DuelAction> {
  const ctx = useContext(DuelDispatchContext);
  if (!ctx) throw new Error("useDuelDispatch must be used within a DuelProvider");
  return ctx;
}
