import { useState } from "react";
import { FormationPicker } from "../components/FormationPicker";
import { useGameData } from "../game/GameDataContext";
import { useDuelDispatch } from "../state/duelContext";

export function DuelSetupScreen({ onBackToModes }) {
  const { formations } = useGameData();
  const dispatch = useDuelDispatch();
  const [formationA, setFormationA] = useState(null);

  const byId = (id) => formations.find((f) => f.id === id) ?? null;
  const formationIds = formations.map((f) => f.id);

  if (!formationA) {
    return (
      <div className="formation-picker">
        <span className="formation-picker__eyebrow">Head-to-Head</span>
        <h1 className="formation-picker__title">Player A: pick your shape</h1>
        <p className="formation-picker__subtitle">Pass the device to Player B once you're set.</p>
        <FormationPicker formations={formationIds} onSelect={(id) => setFormationA(byId(id))} />
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
        formations={formationIds}
        onSelect={(id) => {
          const formationB = byId(id);
          if (formationB) dispatch({ type: "START_DUEL", formationA, formationB });
        }}
      />
      <button type="button" className="formation-picker__back" onClick={() => setFormationA(null)}>
        &larr; Back
      </button>
    </div>
  );
}
