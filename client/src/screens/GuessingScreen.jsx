import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import Balloon from '../components/Balloon.jsx';
import { NOTE_MIN, NOTE_MAX } from '../constants.js';

export default function GuessingScreen() {
  const { players, myId, isChooser, chooserId, round, questions, answers, answerGuesses, suggestedGuess, submitGuess } =
    useGame();
  const [selected, setSelected] = useState(null);
  const [sent, setSent] = useState(false);

  const chooser = players.find((p) => p.id === chooserId);
  const numbers = Array.from({ length: NOTE_MAX - NOTE_MIN + 1 }, (_, i) => NOTE_MIN + i);

  function handlePick(n) {
    if (sent) return;
    setSelected(n);
    setSent(true);
    submitGuess(n);
  }

  return (
    <div className="card">
      <div className="section-title">Rodada {round}</div>

      <div className="answer-feed" style={{ marginBottom: 16 }}>
        {Object.keys(questions).map((id) => {
          const player = players.find((p) => p.id === id);
          const answer = answers[id];
          return (
            <div key={id} className="answer-item">
              <div className="q">{questions[id]}</div>
              <div className="who">{player?.name ?? '???'}</div>
              <div className="a">
                {answer?.text}
                {answerGuesses[id] ? <span className="rating-hint"> — nota {answerGuesses[id]}</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      {isChooser ? (
        <>
          <p className="waiting-text" style={{ padding: '4px 0' }}>
            {sent
              ? 'Revelando...'
              : suggestedGuess
              ? `Qual foi a nota da rodada? Baseado nas suas avaliações, achamos que pode ser ${suggestedGuess}.`
              : 'Qual foi a nota da rodada?'}
          </p>
          <div className={`balloons-grid ${sent ? 'drumroll' : ''}`}>
            {numbers.map((n) => (
              <Balloon
                key={n}
                number={n}
                selected={selected === n}
                suggested={!sent && n === suggestedGuess}
                disabled={sent}
                onClick={handlePick}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="waiting-text">Aguardando o palpite de {chooser?.name ?? 'o jogador escolhido'}...</p>
      )}
    </div>
  );
}
