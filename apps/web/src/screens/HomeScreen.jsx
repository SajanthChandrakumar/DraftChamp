import { useMemo, useState } from "react";
import { FormationPicker } from "../components/FormationPicker";
import { ClubPicker } from "../components/ClubPicker";
import { useGameData } from "../game/GameDataContext";
import { useDraftDispatch } from "../state/draftContext";

export function HomeScreen({ mode, onBackToModes }) {
  const { league, formations, modes } = useGameData();
  const dispatch = useDraftDispatch();
  const [clubCode, setClubCode] = useState(null);

  const modeInfo = modes.find((m) => m.id === mode);
  const needsClub = modeInfo?.needsClub ?? false;

  const clubsWithCombos = useMemo(() => {
    const codes = new Set(league.combos.map((c) => c.team));
    return league.teams.filter((t) => codes.has(t.code));
  }, [league]);

  const canStart = !needsClub || !!clubCode;

  const handleSelectFormation = (formationId) => {
    const formation = formations.find((f) => f.id === formationId);
    if (!formation || !canStart) return;
    dispatch({
      type: "START_SESSION",
      formation,
      mode,
      budgetCap: modeInfo?.hasBudget ? modeInfo.defaultBudgetCap : null,
      peakClubCode: needsClub ? clubCode : null,
    });
  };

  return (
    <div className="formation-picker">
      <span className="formation-picker__eyebrow">{modeInfo?.label ?? "DraftChamp"}</span>
      <h1 className="formation-picker__title">Pick your shape</h1>
      <p className="formation-picker__subtitle">{modeInfo?.description}</p>

      {needsClub && (
        <ClubPicker clubs={clubsWithCombos} value={clubCode} onChange={setClubCode} />
      )}

      <FormationPicker
        formations={formations.map((f) => f.id)}
        onSelect={handleSelectFormation}
        disabled={!canStart}
      />

      <button type="button" className="formation-picker__back" onClick={onBackToModes}>
        &larr; Choose a different mode
      </button>
    </div>
  );
}
