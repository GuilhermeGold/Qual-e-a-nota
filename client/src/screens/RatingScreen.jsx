import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import NotePicker from '../components/NotePicker.jsx';

export default function RatingScreen() {
  const { players, chooserId, round, questions, answers, isChooser, submitAnswerRatings } = useGame();
  const [ratings, setRatings] = useState({});

  const chooser = players.find((p) => p.id === chooserId);
  const targetIds = Object.keys(questions);

  function updateRating(targetId, value) {
    setRatings((prev) => ({ ...prev, [targetId]: value }));
  }

  function handleSubmit() {
    const allRated = targetIds.every((id) => ratings[id]);
    if (!allRated) return;
    submitAnswerRatings(ratings);
  }

  if (isChooser) {
    const allRated = targetIds.length > 0 && targetIds.every((id) => ratings[id]);
    return (
      <div className="card">
        <div className="section-title">Rodada {round} — Avalie cada resposta</div>
        <p className="waiting-text" style={{ padding: 0, marginBottom: 14 }}>
          Dê uma nota (1–10) pra cada resposta. Se a nota que você der bater com a nota real, quem
          respondeu também ganha ponto — mesmo que seu palpite geral erre.
        </p>
        {targetIds.map((id) => {
          const player = players.find((p) => p.id === id);
          const answer = answers[id];
          return (
            <div key={id} className="rating-item">
              <div className="q">{questions[id]}</div>
              <div className="who">{player?.name ?? '???'}</div>
              <div className="a">{answer?.text}</div>
              <NotePicker value={ratings[id]} onChange={(value) => updateRating(id, value)} />
            </div>
          );
        })}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!allRated}
          onClick={handleSubmit}
          style={{ marginTop: 4 }}
        >
          Confirmar avaliações
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title">Rodada {round}</div>
      <p className="waiting-text">
        {chooser?.name ?? 'O jogador escolhido'} está avaliando cada resposta...
      </p>
    </div>
  );
}
