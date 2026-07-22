import { useGame } from '../context/GameContext.jsx';
import { PHASES } from '../constants.js';

function getMood({ phase, isChooser, answered, result }) {
  switch (phase) {
    case PHASES.LOBBY:
      return { emoji: '😄', caption: 'Bora começar?', anim: 'mascot-bounce-idle' };
    case PHASES.ASSIGNING:
      return isChooser
        ? { emoji: '🤔', caption: 'Pensando nas perguntas...', anim: 'mascot-think' }
        : { emoji: '👀', caption: 'Vendo a nota...', anim: 'mascot-bounce-idle' };
    case PHASES.ANSWERING:
      if (isChooser) return { emoji: '👀', caption: 'De olho nas respostas...', anim: 'mascot-bounce-idle' };
      return answered
        ? { emoji: '😌', caption: 'Já respondi!', anim: 'mascot-bounce-idle' }
        : { emoji: '✍️', caption: 'Escrevendo...', anim: 'mascot-think' };
    case PHASES.RATING:
      return isChooser
        ? { emoji: '🧐', caption: 'Avaliando cada resposta...', anim: 'mascot-think' }
        : { emoji: '👀', caption: 'Aguardando avaliação...', anim: 'mascot-bounce-idle' };
    case PHASES.GUESSING:
      return isChooser
        ? { emoji: '🧐', caption: 'Qual será a nota?', anim: 'mascot-think' }
        : { emoji: '🤞', caption: 'Torcendo...', anim: 'mascot-bounce-idle' };
    case PHASES.REVEAL:
      return result?.correct
        ? { emoji: '🥳', caption: 'Acertou!', anim: 'mascot-bounce-happy' }
        : { emoji: '😢', caption: 'Foi por pouco...', anim: 'mascot-shake-sad' };
    case PHASES.GAME_OVER:
      return { emoji: '🏆', caption: 'Fim de jogo!', anim: 'mascot-bounce-idle' };
    default:
      return { emoji: '🙂', caption: '', anim: 'mascot-bounce-idle' };
  }
}

export default function Mascot() {
  const { phase, isChooser, myId, answers, result } = useGame();
  const { emoji, caption, anim } = getMood({ phase, isChooser, answered: Boolean(answers[myId]), result });

  return (
    <div className="mascot" key={phase + emoji}>
      <div className={`mascot-face ${anim}`}>{emoji}</div>
      {caption ? <div className="mascot-caption">{caption}</div> : null}
    </div>
  );
}
