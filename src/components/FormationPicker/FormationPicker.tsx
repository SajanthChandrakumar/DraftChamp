import type { FormationId } from "../../engine/formations";

export interface FormationPickerProps {
  formations: FormationId[];
  onSelect: (id: FormationId) => void;
}

export function FormationPicker({ formations, onSelect }: FormationPickerProps) {
  return (
    <div className="formation-picker">
      <h1>DraftChamp</h1>
      <p>Pick a formation to start your draft.</p>
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
