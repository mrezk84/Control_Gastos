import React from 'react';

/**
 * Logo SVG profesional para Control de Gastos
 * Diseño minimalista con gradiente emerald-teal
 */
const Logo = ({ className = '', width = 40, height = 40, variant = 'default' }) => {
  const gradientId = `logo-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const glowId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  const gradients = {
    default: ['#047857', '#10b981', '#2dd4bf'],
    light: ['#34d399', '#22d3ee'],
    gold: ['#b8985a', '#e2c893'],
  };

  const colors = gradients[variant] || gradients.default;

  return (
    <svg
      className={`logo-svg ${className}`}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset={variant === 'default' ? '55%' : '50%'} stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2] || colors[1]} />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Card/Document shape */}
      <rect
        x="8"
        y="6"
        width="24"
        height="28"
        rx="3"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        fill="rgba(16, 185, 129, 0.08)"
      />

      {/* Dollar sign/Currency symbol */}
      <path
        d="M20 12V28M17 15H22.5C23.8807 15 25 16.1193 25 17.5C25 18.8807 23.8807 20 22.5 20H20M17 25H22.5C23.8807 25 25 23.8807 25 22.5C25 21.1193 23.8807 20 22.5 20H20"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />

      {/* Trend line up */}
      <path
        d="M10 32L14 28L18 30L24 24L28 22"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Small dot at end of trend */}
      <circle
        cx="28"
        cy="22"
        r="1.5"
        fill={`url(#${gradientId})`}
        filter={`url(#${glowId})`}
      />

      {/* Checkmark for control/success */}
      <path
        d="M30 8L32 10L36 6"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
};

export default Logo;
