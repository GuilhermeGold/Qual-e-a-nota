import { pickRandomQuestion } from '../constants.js';

export default function QuestionPicker({ targetName, value, usedQuestions, onChange }) {
  function handleShuffle() {
    onChange(pickRandomQuestion(usedQuestions));
  }

  return (
    <div className="question-field">
      <div className="target-name">
        <span>Pergunta para {targetName}</span>
      </div>
      <div className="field-row">
        <input
          type="text"
          placeholder="Digite uma pergunta..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={140}
        />
        <button type="button" className="btn btn-secondary btn-small" onClick={handleShuffle}>
          🎲 Sortear
        </button>
      </div>
    </div>
  );
}
