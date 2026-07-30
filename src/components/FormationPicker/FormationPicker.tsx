import type { FormationId } from "../../engine/formations";

export interface FormationPickerProps {
  formations: FormationId[];
  onSelect: (id: FormationId) => void;
}

export function FormationPicker({ formations, onSelect }: FormationPickerProps) {
  return (
    <div className="formation-picker">
      <span className="formation-picker__eyebrow">DraftChamp</span>
      <h1 className="formation-picker__title">Pick your shape</h1>
      <p className="formation-picker__subtitle">
        Every spin gives you one player. Choose a formation, then build the XI around it.
      </p>
      <div className="formation-picker__options">
        {formations.map((id) => (
          <button key={id} type="button" className="formation-picker__option" onClick={() => onSelect(id)}>
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
