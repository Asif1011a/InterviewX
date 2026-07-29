'use client';
import { useEffect, useState } from 'react';

interface Props {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showLabel?: boolean;
}

export default function ScoreRing({
  score, max = 10, size = 80, strokeWidth = 7, color, label, showLabel = true
}: Props) {
  const [animated, setAnimated] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score / max;
  const offset = circumference - pct * circumference;

  const getColor = () => {
    if (color) return color;
    if (pct >= 0.7) return '#10b981';
    if (pct >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={getColor()} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        {showLabel && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: size > 60 ? '1.25rem' : '0.875rem', fontWeight: 800, color: getColor(), fontFamily: 'Space Grotesk' }}>
              {score}
            </span>
          </div>
        )}
      </div>
      {label && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>{label}</span>}
    </div>
  );
}
