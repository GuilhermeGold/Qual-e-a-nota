import { useGame } from '../context/GameContext.jsx';
import PlayerList from '../components/PlayerList.jsx';
import RevealAnimation from '../components/RevealAnimation.jsx';

export default function RevealScreen() {
  const { players, hostId, myId, chooserId, round, result, isHost, nextRound, endGame } = useGame();
  const chooser = players.find((p) => p.id === chooserId);

  if (!result) return null;

  return (
    <div className="card">
      <RevealAnimation key={`${round}-${result.correct}`} correct={result.correct} />
      <div className="section-title">Rodada {round}</div>
      <div className="reveal-result">
        <div className={`verdict ${result.correct ? 'correct' : 'wrong'}`}>
          {result.correct ? `🎉 ${chooser?.name ?? 'O jogador'} acertou!` : `😢 ${chooser?.name ?? 'O jogador'} errou!`}
        </div>
        <div className="numbers">
          Nota real: <strong>{result.note}</strong> — Palpite: <strong>{result.guess}</strong>
        </div>
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
