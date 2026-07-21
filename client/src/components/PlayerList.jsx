export default function PlayerList({ players, chooserId, hostId, myId, onKick }) {
  return (
    <ul className="player-list">
      {players.map((p) => (
        <li key={p.id} className={`player-row ${p.id === chooserId ? 'chooser' : ''} ${!p.connected ? 'disconnected' : ''}`}>
          <span>
            {p.name}
            {p.id === myId ? ' (você)' : ''}
            {p.isHost ? <span className="badge">host</span> : null}
            {p.id === chooserId ? <span className="badge">escolhido</span> : null}
            {!p.connected ? <span className="badge">offline</span> : null}
          </span>
          <span className="row" style={{ gap: 10, flex: '0 0 auto', alignItems: 'center' }}>
            <span className="score">{p.score} pt{p.score === 1 ? '' : 's'}</span>
            {onKick && p.id !== myId ? (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => onKick(p.id)}>
                remover
              </button>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
