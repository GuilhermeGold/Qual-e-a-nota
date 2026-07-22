import { useGame } from '../context/GameContext.jsx';
import PlayerList from '../components/PlayerList.jsx';
import RevealAnimation from '../components/RevealAnimation.jsx';
import RevealBalloon from '../components/RevealBalloon.jsx';
import ReactionOverlay from '../components/ReactionOverlay.jsx';
import { REACTIONS } from '../constants.js';

export default function RevealScreen() {
  const {
    players,
    hostId,
    myId,
    chooserId,
    round,
    questions,
    answers,
    result,
    isHost,
    nextRound,
    endGame,
    reactions,
    sendReaction,
    streak,
    bestStreak,
  } = useGame();
  const chooser = players.find((p) => p.id === chooserId);

  if (!result) return null;

  const isNewRecord = result.correct && streak >= 2 && streak === bestStreak;

  return (
    <div className="card">
      <RevealAnimation key={`${round}-${result.correct}`} correct={result.correct} />
      <ReactionOverlay reactions={reactions} />
      <div className="section-title">Rodada {round}</div>
      <RevealBalloon key={`${round}-balloon`} number={result.guess} correct={result.correct} />
      <div className="reveal-result">
        <div className={`verdict ${result.correct ? 'correct' : 'wrong'}`}>
          {result.correct ? `🎉 ${chooser?.name ?? 'O jogador'} acertou!` : `😢 ${chooser?.name ?? 'O jogador'} errou!`}
        </div>
        <div className="numbers">
          Nota real: <strong>{result.note}</strong> — Palpite: <strong>{result.guess}</strong>
        </div>
        {result.correct && streak >= 2 ? (
          <div className="streak-line up">
            🔥 Sequência do grupo: {streak}
            {isNewRecord ? ' — novo recorde!' : ''}
          </div>
        ) : null}
        {!result.correct && result.streakBefore >= 2 ? (
          <div className="streak-line broken">💥 Sequência de {result.streakBefore} acertos foi quebrada.</div>
        ) : null}
      </div>

      {result.answerGuesses ? (
        <>
          <div className="section-title" style={{ marginTop: 18 }}>
            Notas por resposta
          </div>
          <div className="answer-feed" style={{ marginBottom: 4 }}>
            {Object.keys(result.answerGuesses).map((id) => {
              const player = players.find((p) => p.id === id);
              const rating = result.answerGuesses[id];
              const isCorrect = result.answerResults?.[id];
              return (
                <div key={id} className={`answer-item ${isCorrect ? 'correct-rating' : ''}`}>
                  <div className="q">{questions[id]}</div>
                  <div className="who">{player?.name ?? '???'}</div>
                  <div className="a">
                    {answers[id]?.text} — nota dada: {rating}
                    {isCorrect ? ' ✅ +1 pt' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="reaction-picker">
        {REACTIONS.map((emoji) => (
          <button key={emoji} type="button" className="reaction-btn" onClick={() => sendReaction(emoji)}>
            {emoji}
          </button>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 18 }}>
        Placar
      </div>
      <PlayerList players={players} chooserId={chooserId} hostId={hostId} myId={myId} />

      {isHost ? (
        <div className="row" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={endGame}>
            Encerrar jogo
          </button>
          <button type="button" className="btn btn-primary" onClick={nextRound}>
            Próxima rodada
          </button>
        </div>
      ) : (
        <p className="waiting-text">Aguardando o host avançar a rodada...</p>
      )}
    </div>
  );
}
