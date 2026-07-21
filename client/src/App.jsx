import { useGame } from './context/GameContext.jsx';
import { PHASES } from './constants.js';
import Mascot from './components/Mascot.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import AssigningScreen from './screens/AssigningScreen.jsx';
import AnsweringScreen from './screens/AnsweringScreen.jsx';
import GuessingScreen from './screens/GuessingScreen.jsx';
import RevealScreen from './screens/RevealScreen.jsx';
import GameOverScreen from './screens/GameOverScreen.jsx';

function screenFor(phase) {
  switch (phase) {
    case PHASES.ASSIGNING:
      return <AssigningScreen />;
    case PHASES.ANSWERING:
      return <AnsweringScreen />;
    case PHASES.GUESSING:
      return <GuessingScreen />;
    case PHASES.REVEAL:
      return <RevealScreen />;
    case PHASES.GAME_OVER:
      return <GameOverScreen />;
    case PHASES.LOBBY:
    default:
      return <LobbyScreen />;
  }
}

export default function App() {
  const { roomCode, reconnecting, displayPhase } = useGame();

  return (
    <div className="app-shell">
      <h1 className="title">🎯 Qual é a Nota?</h1>
      <p className="subtitle">Adivinhe a nota da rodada pelas respostas dos outros jogadores</p>
      {roomCode && !reconnecting ? <Mascot /> : null}
      {reconnecting ? (
        <div className="card">
          <p className="waiting-text">Reconectando...</p>
        </div>
      ) : roomCode ? (
        <div className="phase-transition" key={displayPhase}>
          {screenFor(displayPhase)}
        </div>
      ) : (
        <HomeScreen />
      )}
    </div>
  );
}
