import { FormationPicker } from "../components/FormationPicker";
import type { FormationId } from "../engine/formations";
import { useDraftDispatch } from "../state/draftContext";

const FORMATION_IDS: FormationId[] = ["4-3-3", "4-4-2", "3-5-2"];

export function HomeScreen() {
  const dispatch = useDraftDispatch();

  return (
    <FormationPicker
      formations={FORMATION_IDS}
      onSelect={(formationId) => dispatch({ type: "SELECT_FORMATION", formationId })}
    />
  );
}
