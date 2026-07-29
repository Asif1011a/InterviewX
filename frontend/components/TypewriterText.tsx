'use client';
import { useEffect, useState } from 'react';

interface Props {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
}

export default function TypewriterText({ text, speed = 22, onDone, className = '' }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
        onDone?.();
        return;
      }
      setDisplayed(text.slice(0, i + 1));
      i++;
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </span>
  );
}
