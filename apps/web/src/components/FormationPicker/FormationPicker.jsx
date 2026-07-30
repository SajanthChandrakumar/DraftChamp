export function FormationPicker({ formations, onSelect, disabled = false }) {
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
