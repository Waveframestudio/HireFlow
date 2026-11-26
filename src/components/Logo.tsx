import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  className = '',
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
      >
        <defs>
          <linearGradient id="hf-logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#11314E" />
            <stop offset="100%" stopColor="#0A1E30" />
          </linearGradient>
          <linearGradient id="hf-logo-coral" x1="18" y1="18" x2="50" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7654" />
            <stop offset="100%" stopColor="#EC623E" />
          </linearGradient>
          <linearGradient id="hf-logo-cream" x1="16" y1="16" x2="32" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FCF2E4" />
          </linearGradient>
          <filter id="hf-logo-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#EC623E" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Base Container */}
        <rect width="64" height="64" rx="16" fill="url(#hf-logo-bg)" stroke="#1C456B" strokeWidth="1.5" />

        {/* Left Foundation Stem (H) */}
        <path
          d="M17 17 C17 15.343 18.343 14 20 14 C21.657 14 23 15.343 23 17 V47 C23 48.657 21.657 50 20 50 C18.343 50 17 48.657 17 47 Z"
          fill="url(#hf-logo-cream)"
        />

        {/* Dynamic Coral Flow Ribbon (H to F wave) */}
        <path
          d="M23 31 C28 31 31 24 37 24 H45 C46.657 24 48 22.657 48 21 C48 19.343 46.657 18 45 18 H36 C28 18 24 27 20 27 C18.343 27 17 28.343 17 30 C17 31.657 18.343 33 20 33 C21 33 22 32.5 23 31 Z"
          fill="url(#hf-logo-coral)"
          filter="url(#hf-logo-glow)"
        />

        {/* Right Pillar */}
        <path
          d="M33 25 C33 23.343 34.343 22 36 22 C37.657 22 39 23.343 39 25 V47 C39 48.657 37.657 50 36 50 C34.343 50 33 48.657 33 47 Z"
          fill="url(#hf-logo-cream)"
          opacity="0.95"
        />

        {/* F Middle Flow Arm */}
        <path
          d="M37 32 H44 C45.657 32 47 33.343 47 35 C47 36.657 45.657 38 44 38 H37 C35.343 38 34 36.657 34 35 C34 33.343 35.343 32 37 32 Z"
          fill="url(#hf-logo-coral)"
        />

        {/* Talent Match Spark */}
        <path
          d="M48 11 L49.2 13.8 L52 15 L49.2 16.2 L48 19 L46.8 16.2 L44 15 L46.8 13.8 Z"
          fill="#FCF2E4"
        />
      </svg>

      {showText && (
        <div>
          <h1 className="font-bold text-base leading-tight text-[#11314E]">HireFlow</h1>
          <p className="text-xs text-slate-500">ATS Interno · RRHH</p>
        </div>
      )}
    </div>
  );
};
