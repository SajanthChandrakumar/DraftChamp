import type { Team } from "../../leagues/types";

export interface ClubPickerProps {
  clubs: Team[];
  value: string | null;
  onChange: (teamCode: string) => void;
}

export function ClubPicker({ clubs, value, onChange }: ClubPickerProps) {
  return (
    <div className="club-picker">
      <span className="club-picker__label">Pick a club to mix eras of</span>
      <div className="club-picker__options">
        {clubs.map((club) => (
          <button
            key={club.code}
            type="button"
            className={`club-picker__option${club.code === value ? " club-picker__option--selected" : ""}`}
            onClick={() => onChange(club.code)}
          >
            {club.name}
          </button>
        ))}
      </div>
    </div>
  );
}
