import { NOTE_MIN, NOTE_MAX } from '../constants.js';

export default function NotePicker({ value, onChange }) {
  const numbers = Array.from({ length: NOTE_MAX - NOTE_MIN + 1 }, (_, i) => NOTE_MIN + i);

  return (
    <div className="note-picker">
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          className={`note-pill ${value === n ? 'selected' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
