
import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  from: number;
  to: number;
  duration?: number;
  separator?: string;
  direction?: 'up' | 'down';
  className?: string;
  startCounting?: boolean;
  isCurrency?: boolean;
}

const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to,
  duration = 1,
  separator = '.',
  className = '',
  startCounting = true,
  isCurrency = true
}) => {
  const [count, setCount] = useState(from);
  const countRef = useRef(from);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startCounting) return;

    // Reset animation when 'to' value changes
    startTimeRef.current = null;
    const startValue = countRef.current;
    const endValue = to;
    
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
      
      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentCount = startValue + (endValue - startValue) * easeProgress;
      setCount(currentCount);
      countRef.current = currentCount;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [to, duration, startCounting]);

  const formatValue = (val: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(val);
    }
    
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/\./g, separator);
  };

  return <span className={className}>{formatValue(count)}</span>;
};

export default CountUp;
