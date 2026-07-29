'use client';
import { useState } from 'react';

interface Props {
  front: React.ReactNode;
  back: React.ReactNode;
  height?: string;
}

export default function FlipCard({ front, back, height = '200px' }: Props) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`flip-card cursor-pointer${flipped ? ' flipped' : ''}`}
      style={{ height }}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front glass rounded-2xl p-5 flex flex-col justify-between" style={{ height }}>
          {front}
        </div>
        <div className="flip-card-back glass-bright rounded-2xl p-5 flex flex-col justify-between" style={{ height, border: '1px solid rgba(99,102,241,0.3)' }}>
          {back}
        </div>
      </div>
    </div>
  );
}
