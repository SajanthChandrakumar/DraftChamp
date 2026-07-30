import { useMemo, useState } from "react";
import { FormationPicker } from "../components/FormationPicker";
import { RecordPicker } from "../components/RecordPicker";
import { ClubPicker } from "../components/ClubPicker";
import type { FormationId } from "../engine/formations";
import { PL_RECORDS } from "../engine/records";
import { DEFAULT_BUDGET_CAP, GAME_MODES, type GameModeId } from "../engine/modes";
import type { LeagueData, Team } from "../leagues/types";
import { useDraftDispatch } from "../state/draftContext";

const FORMATION_IDS: FormationId[] = ["4-3-3", "4-4-2", "3-5-2"];

export interface HomeScreenProps {
  mode: GameModeId;
  leagueData: LeagueData;
  onBackToModes: () => void;
}

export function HomeScreen({ mode, leagueData, onBackToModes }: HomeScreenProps) {
  const dispatch = useDraftDispatch();
  const [recordId, setRecordId] = useState(PL_RECORDS[0].id);
  const [clubCode, setClubCode] = useState<string | null>(null);

  const modeInfo = GAME_MODES.find((m) => m.id === mode);

  const clubsWithCombos = useMemo<Team[]>(() => {
    const codes = new Set(leagueData.combos.map((combo) => combo[0]));
    return Array.from(codes)
      .map((code) => leagueData.teams[code])
      .filter((team): team is Team => !!team);
  }, [leagueData]);

  const needsClub = mode === "peak-xi";
  const canStart = !needsClub || !!clubCode;

  const handleSelectFormation = (formationId: FormationId) => {
    if (!canStart) return;
    dispatch({
      type: "START_SESSION",
      formationId,
      mode,
      targetRecordId: mode === "record-chase" ? recordId : undefined,
      budgetCap: mode === "budget" ? DEFAULT_BUDGET_CAP : undefined,
      peakClubCode: mode === "peak-xi" ? clubCode ?? undefined : undefined,
    });
  };

  return (
    <div className="formation-picker">
      <span className="formation-picker__eyebrow">{modeInfo?.label ?? "DraftChamp"}</span>
      <h1 className="formation-picker__title">Pick your shape</h1>
      <p className="formation-picker__subtitle">{modeInfo?.description}</p>

      {mode === "record-chase" && <RecordPicker value={recordId} onChange={setRecordId} />}
      {mode === "peak-xi" && (
        <ClubPicker clubs={clubsWithCombos} value={clubCode} onChange={setClubCode} />
      )}

      <FormationPicker formations={FORMATION_IDS} onSelect={handleSelectFormation} disabled={!canStart} />

      <button type="button" className="formation-picker__back" onClick={onBackToModes}>
        &larr; Choose a different mode
      </button>
    </div>
  );
}
