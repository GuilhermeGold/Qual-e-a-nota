export default function RevealBalloon({ number, correct }) {
  return (
    <div className="reveal-balloon-stage">
      <div className={`balloon reveal-balloon ${correct ? 'balloon-pop' : 'balloon-deflate'}`}>{number}</div>
    </div>
  );
}
