import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import QuestionPicker from '../components/QuestionPicker.jsx';
import { pickRandomQuestion } from '../constants.js';

export default function AssigningScreen() {
  const { players, myId, isChooser, chooserId, note, round, submitQuestions } = useGame();
  const [drafts, setDrafts] = useState({});

  const chooser = players.find((p) => p.id === chooserId);
  const targets = players.filter((p) => p.id !== chooserId);

  function updateDraft(targetId, text) {
    setDrafts((prev) => ({ ...prev, [targetId]: text }));
  }

  function handleShuffleAll() {
    setDrafts((prev) => {
      const used = Object.values(prev).filter(Boolean);
      const next = { ...prev };
      for (const t of targets) {
        if (!next[t.id]) {
          const q = pickRandomQuestion(used);
          used.push(q);
          next[t.id] = q;
        }
      }
      return next;
    });
  }

  function handleSubmit() {
    const allFilled = targets.every((t) => drafts[t.id]?.trim());
    if (!allFilled) return;
    submitQuestions(drafts);
  }

  if (isChooser) {
    const allFilled = targets.every((t) => drafts[t.id]?.trim());
    const usedQuestions = Object.values(drafts).filter(Boolean);
    return (
      <div className="card">
        <div className="section-title">Rodada {round} — Você é o escolhido!</div>
        <p className="waiting-text" style={{ padding: 0, marginBottom: 14 }}>
          Envie uma pergunta pra cada jogador. As respostas vão te ajudar a adivinhar a nota da rodada.
        </p>
        {targets.map((t) => (
          <QuestionPicker
            key={t.id}
            targetName={t.name}
            value={drafts[t.id] || ''}
            usedQuestions={usedQuestions}
            onChange={(text) => updateDraft(t.id, text)}
          />
        ))}
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={handleShuffleAll}>
            🎲 Sortear todas
          </button>
          <button type="button" className="btn btn-primary" disabled={!allFilled} onClick={handleSubmit}>
            Enviar perguntas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title">Rodada {round}</div>
      <div className="note-banner">
        <div className="note-label">A nota da rodada é</div>
        <div className="note-value">{note}</div>
      </div>
      <p className="waiting-text">
        Aguardando {chooser?.name ?? 'o jogador escolhido'} enviar as perguntas...
      </p>
    </div>
  );
}
