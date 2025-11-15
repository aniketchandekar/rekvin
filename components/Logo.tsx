import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect width="120" height="120" rx="30" className="fill-slate-800 dark:fill-slate-200" />
        <path
          d="M42 30H58.5C70.9264 30 81 40.0736 81 52.5V52.5C81 64.9264 70.9264 75 58.5 75H42"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <path
          d="M60 75L81 90"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-slate-100 dark:stroke-slate-800"
        />
      </svg>
    </div>
  );
};

export default Logo;
