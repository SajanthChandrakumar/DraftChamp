import { PL_RECORDS } from "../../engine/records";

export interface RecordPickerProps {
  value: string;
  onChange: (recordId: string) => void;
}

export function RecordPicker({ value, onChange }: RecordPickerProps) {
  return (
    <div className="record-picker">
      <span className="record-picker__label">Pick a record to chase</span>
      <div className="record-picker__options">
        {PL_RECORDS.map((record) => (
          <button
            key={record.id}
            type="button"
            className={`record-picker__option${record.id === value ? " record-picker__option--selected" : ""}`}
            onClick={() => onChange(record.id)}
          >
            <span className="record-picker__option-label">{record.label}</span>
            <span className="record-picker__option-holder">
              {record.holder} &middot; {record.season}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
