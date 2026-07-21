import { useMemo } from 'react';

const CONFETTI_COLORS = ['#ff5c8a', '#ffb800', '#2ecc71', '#2575fc', '#ff8a5c'];
const SAD_EMOJIS = ['😢', '💧', '😭'];

export default function RevealAnimation({ correct }) {
  const pieces = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      emoji: SAD_EMOJIS[i % SAD_EMOJIS.length],
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="reveal-anim" aria-hidden="true">
      {pieces.map((p) =>
        correct ? (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ) : (
          <span
            key={p.id}
            className="sad-drop"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            {p.emoji}
          </span>
        )
      )}
    </div>
  );
}
