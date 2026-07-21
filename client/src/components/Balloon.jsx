export default function Balloon({ number, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`balloon ${selected ? 'selected' : ''}`}
      disabled={disabled}
      onClick={() => onClick(number)}
    >
      {number}
    </button>
  );
}
