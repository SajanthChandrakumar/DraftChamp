import type { FormationId } from "../../engine/formations";

export interface FormationPickerProps {
  formations: FormationId[];
  onSelect: (id: FormationId) => void;
  disabled?: boolean;
}

export function FormationPicker({ formations, onSelect, disabled = false }: FormationPickerProps) {
  return (
    <div className="formation-picker__options">
      {formations.map((id) => (
        <button
          key={id}
          type="button"
          className="formation-picker__option"
          onClick={() => onSelect(id)}
          disabled={disabled}
        >
          {id}
        </button>
      ))}
    </div>
  );
}
