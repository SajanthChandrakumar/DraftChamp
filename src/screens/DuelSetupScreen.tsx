import { useState } from "react";
import { FormationPicker } from "../components/FormationPicker";
import type { FormationId } from "../engine/formations";
import { useDuelDispatch } from "../state/duelContext";

const FORMATION_IDS: FormationId[] = ["4-3-3", "4-4-2", "3-5-2"];

export interface DuelSetupScreenProps {
  onBackToModes: () => void;
}

export function DuelSetupScreen({ onBackToModes }: DuelSetupScreenProps) {
  const dispatch = useDuelDispatch();
  const [formationA, setFormationA] = useState<FormationId | null>(null);

  if (!formationA) {
    return (
      <div className="formation-picker">
        <span className="formation-picker__eyebrow">Head-to-Head</span>
        <h1 className="formation-picker__title">Player A: pick your shape</h1>
        <p className="formation-picker__subtitle">Pass the device to Player B once you're set.</p>
        <FormationPicker formations={FORMATION_IDS} onSelect={setFormationA} />
        <button type="button" className="formation-picker__back" onClick={onBackToModes}>
          &larr; Choose a different mode
        </button>
      </div>
    );
  }

  return (
    <div className="formation-picker">
      <span className="formation-picker__eyebrow">Head-to-Head</span>
      <h1 className="formation-picker__title">Player B: pick your shape</h1>
      <p className="formation-picker__subtitle">
        You'll draft from the same reveals as Player A — whoever picks first gets first choice.
      </p>
      <FormationPicker
        formations={FORMATION_IDS}
        onSelect={(formationB) => dispatch({ type: "START_DUEL", formationA, formationB })}
      />
      <button type="button" className="formation-picker__back" onClick={() => setFormationA(null)}>
        &larr; Back
      </button>
    </div>
  );
}
