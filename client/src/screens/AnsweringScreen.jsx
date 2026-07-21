import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

function AnswerFeed({ players, questions, answers, myId }) {
  const targetIds = Object.keys(questions);
  return (
    <div className="answer-feed">
      {targetIds.map((id) => {
        const player = players.find((p) => p.id === id);
        const answer = answers[id];
        return (
          <div key={id} className={`answer-item ${answer ? '' : 'pending'}`}>
            <div className="q">{questions[id]}</div>
            <div className="who">{player?.name ?? '???'}{id === myId ? ' (você)' : ''}</div>
            {answer ? <div className="a">{answer.text}</div> : <div className="a">aguardando resposta...</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function AnsweringScreen() {
  const { players, myId, isChooser, note, round, questions, answers, submitAnswer } = useGame();
  const [text, setText] = useState('');

  const myQuestion = questions[myId];
  const alreadyAnswered = Boolean(answers[myId]);
  const iAmTarget = Boolean(myQuestion);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    submitAnswer(text.trim());
    setText('');
  }

  return (
    <div className="card">
      <div className="section-title">Rodada {round}</div>
      {!isChooser && note != null ? (
        <div className="note-banner">
          <div className="note-label">A nota da rodada é</div>
          <div className="note-value">{note}</div>
        </div>
      ) : null}

      {iAmTarget && !alreadyAnswered ? (
        <form onSubmit={handleSubmit}>
          <label>Sua pergunta</label>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 0 }}>{myQuestion}</p>
          <label htmlFor="answer">
            Responda pensando em algo que, na sua opinião, seria nota {note ?? '?'}
          </label>
          <textarea
            id="answer"
            rows={2}
            maxLength={140}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sua resposta..."
            style={{ marginBottom: 12 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
            Responder
          </button>
        </form>
      ) : (
        <>
          <p className="waiting-text" style={{ padding: '8px 0' }}>
            {isChooser
              ? 'Acompanhe as respostas chegando ao vivo:'
              : alreadyAnswered
              ? 'Resposta enviada! Aguardando os outros jogadores...'
              : 'Aguardando as respostas...'}
          </p>
          <AnswerFeed players={players} questions={questions} answers={answers} myId={myId} />
        </>
      )}
    </div>
  );
}
