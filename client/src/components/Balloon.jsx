export default function Balloon({ number, selected, suggested, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`balloon ${selected ? 'selected' : ''} ${suggested ? 'suggested' : ''}`}
      disabled={disabled}
      onClick={() => onClick(number)}
    >
      {number}
    </button>
  );
}
