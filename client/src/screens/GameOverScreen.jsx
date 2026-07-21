import { useGame } from '../context/GameContext.jsx';

export default function GameOverScreen() {
  const { players, isHost, restartGame, leaveRoom } = useGame();
  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="card">
      <div className="section-title" style={{ textAlign: 'center' }}>
        🏆 Fim de jogo!
      </div>
      <ul className="leaderboard">
        {ranked.map((p, i) => (
          <li key={p.id}>
            <span>
              {i + 1}º {p.name}
            </span>
            <span>{p.score} pt{p.score === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>

      {isHost ? (
        <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={restartGame}>
          Jogar de novo
        </button>
      ) : (
        <p className="waiting-text">Aguardando o host reiniciar...</p>
      )}
      <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={leaveRoom}>
        Sair da sala
      </button>
    </div>
  );
}
