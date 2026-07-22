import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function HomeScreen() {
  const { createRoom, joinRoom, error } = useGame();
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'create') {
      createRoom(name.trim());
    } else {
      if (!code.trim()) return;
      joinRoom(code.trim(), name.trim());
    }
  }

  return (
    <div className="card">
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="row" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={mode === 'create' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setMode('create')}
        >
          Criar sala
        </button>
        <button
          type="button"
          className={mode === 'join' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setMode('join')}
        >
          Entrar em sala
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Seu nome</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="Como quer ser chamado?"
          style={{ marginBottom: 14 }}
        />
        {mode === 'join' ? (
          <>
            <label htmlFor="code">Código da sala</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="EX: AB3K"
              style={{ marginBottom: 14, textTransform: 'uppercase' }}
            />
          </>
        ) : null}
        <button type="submit" className="btn btn-primary">
          {mode === 'create' ? 'Criar sala' : 'Entrar'}
        </button>
      </form>

      <div className="rules-box">
        <div className="section-title">Como jogar</div>
        <ul className="rules-list">
          <li>A cada rodada, um jogador é sorteado como <strong>escolhido</strong> — sem repetir até todos passarem.</li>
          <li>Todos os outros veem uma nota secreta de 1 a 10 sorteada pra rodada; só o escolhido não vê.</li>
          <li>O escolhido manda uma pergunta pra cada um dos outros jogadores.</li>
          <li>Cada jogador responde pensando em algo que, na sua opinião, seria daquela nota.</li>
          <li>O escolhido dá uma nota pra cada resposta e depois escolhe a nota geral da rodada.</li>
          <li>
            <strong>Pontuação:</strong> +1 pro escolhido se acertar a nota geral; +1 pra cada jogador cuja
            resposta recebeu a nota certa — mesmo que o escolhido erre no geral.
          </li>
          <li>Acertos seguidos do grupo formam uma sequência; errar reinicia o contador.</li>
        </ul>
      </div>
    </div>
  );
}
