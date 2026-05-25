import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 120, strokeWidth = 10 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    if (score === null) return;
    
    // Animate the score filling up
    const duration = 1000; // 1 second
    const steps = 60;
    const stepTime = Math.abs(Math.floor(duration / steps));
    let current = 0;
    
    const timer = setInterval(() => {
      current += (score / steps);
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [score]);

  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-zinc-500 font-medium">--</span>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  let colorClass = "text-emerald-500";
  if (score < 80) colorClass = "text-orange-500";
  if (score < 40) colorClass = "text-red-500";

  const textSizeClass = size < 80 ? 'text-2xl' : 'text-4xl';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-zinc-800"
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-300 ease-out`}
        />
      </svg>
      {/* Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${textSizeClass} font-bold ${colorClass}`}>
          {animatedScore}
        </span>
      </div>
    </div>
  );
};
