import { useMemo } from 'react';

export default function ReactionOverlay({ reactions }) {
  const withPositions = useMemo(
    () =>
      reactions.map((r) => ({
        ...r,
        left: 10 + Math.random() * 80,
        drift: (Math.random() - 0.5) * 60,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reactions.length]
  );

  return (
    <div className="reaction-overlay" aria-hidden="true">
      {withPositions.map((r) => (
        <span
          key={r.id}
          className="reaction-float"
          style={{ left: `${r.left}%`, '--drift': `${r.drift}px` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
