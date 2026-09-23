export default function CricketBallLoader({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`animate-spin ${className}`}
      style={{ animationDuration: '0.9s' }}
      role="status"
      aria-label="Loading"
    >
      <circle cx="50" cy="50" r="46" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
      <circle cx="38" cy="36" r="14" fill="#dc2626" opacity="0.35" />
      <path d="M 50 4 C 30 20, 30 80, 50 96" fill="none" stroke="#fefce8" strokeWidth="2.5" />
      <path d="M 50 4 C 70 20, 70 80, 50 96" fill="none" stroke="#fefce8" strokeWidth="2.5" />
      {[14, 26, 38, 50, 62, 74, 86].map((y, i) => (
        <line
          key={`l-${i}`}
          x1={50 - (10 + Math.sin((y / 100) * Math.PI) * 8)}
          y1={y}
          x2={50 - (10 + Math.sin((y / 100) * Math.PI) * 8) + 5}
          y2={y}
          stroke="#fefce8"
          strokeWidth="1.4"
        />
      ))}
      {[14, 26, 38, 50, 62, 74, 86].map((y, i) => (
        <line
          key={`r-${i}`}
          x1={50 + (10 + Math.sin((y / 100) * Math.PI) * 8) - 5}
          y1={y}
          x2={50 + (10 + Math.sin((y / 100) * Math.PI) * 8)}
          y2={y}
          stroke="#fefce8"
          strokeWidth="1.4"
        />
      ))}
    </svg>
  );
}