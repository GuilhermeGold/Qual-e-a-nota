import { useGame } from '../context/GameContext.jsx';
import PlayerList from '../components/PlayerList.jsx';

const MIN_PLAYERS = 3;

export default function LobbyScreen() {
  const { roomCode, players, hostId, myId, isHost, startGame, kickPlayer, leaveRoom, error } = useGame();

  return (
    <div className="card">
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="section-title" style={{ textAlign: 'center' }}>
        Código da sala
      </div>
      <div className="room-code">{roomCode}</div>
      <p className="subtitle" style={{ color: 'var(--muted)', marginBottom: 8 }}>
        Compartilhe esse código com os outros jogadores.
      </p>

      <div className="section-title" style={{ marginTop: 18 }}>
        Jogadores ({players.length})
      </div>
      <PlayerList players={players} hostId={hostId} myId={myId} onKick={isHost ? kickPlayer : null} />

      {isHost ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 20 }}
          disabled={players.length < MIN_PLAYERS}
          onClick={startGame}
        >
          {players.length < MIN_PLAYERS ? `Aguardando ao menos ${MIN_PLAYERS} jogadores` : 'Começar jogo'}
        </button>
      ) : (
        <p className="waiting-text">Aguardando o host começar o jogo...</p>
      )}

      <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={leaveRoom}>
        Sair da sala
      </button>
    </div>
  );
}
