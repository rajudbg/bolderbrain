export function BrainNetworkIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Connection lines */}
      <line x1="200" y1="80" x2="120" y2="200" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
      <line x1="200" y1="80" x2="280" y2="200" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
      <line x1="120" y1="200" x2="200" y2="320" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
      <line x1="280" y1="200" x2="200" y2="320" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
      <line x1="120" y1="200" x2="280" y2="200" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
      <line x1="200" y1="80" x2="200" y2="320" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />

      {/* Floaty nodes */}
      <circle cx="200" cy="80" r="24" fill="url(#brain-gradient)" opacity="0.25" />
      <circle cx="200" cy="80" r="16" fill="url(#brain-gradient)" opacity="0.4" />
      <path d="M194 86C194 86 196 90 200 90C204 90 206 86 206 86" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5" strokeLinecap="round" />

      <circle cx="120" cy="200" r="20" fill="url(#brain-gradient)" opacity="0.15" />
      <circle cx="120" cy="200" r="12" fill="url(#brain-gradient)" opacity="0.3" />

      <circle cx="280" cy="200" r="20" fill="url(#brain-gradient)" opacity="0.15" />
      <circle cx="280" cy="200" r="12" fill="url(#brain-gradient)" opacity="0.3" />

      <circle cx="200" cy="320" r="20" fill="url(#brain-gradient)" opacity="0.15" />
      <circle cx="200" cy="320" r="12" fill="url(#brain-gradient)" opacity="0.3" />

      {/* Grid dots */}
      {[80, 140, 200, 260, 320].map((y) =>
        [80, 140, 200, 260, 320].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="rgba(99,102,241,0.08)" />
        ))
      )}

      <defs>
        <linearGradient id="brain-gradient" x1="0" y1="0" x2="400" y2="400">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AssessmentFlowIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Flow arrows */}
      <path d="M50 80 L100 80" stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M150 80 L200 80" stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M250 80 L300 80" stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M350 80 L350 220" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M50 220 L300 220" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Nodes */}
      <rect x="12" y="56" width="38" height="48" rx="12" fill="url(#flow-gradient)" opacity="0.2" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
      <rect x="18" y="62" width="26" height="8" rx="4" fill="url(#flow-gradient)" opacity="0.4" />
      <rect x="18" y="76" width="18" height="6" rx="3" fill="url(#flow-gradient)" opacity="0.25" />

      <rect x="112" y="56" width="38" height="48" rx="12" fill="url(#flow-gradient)" opacity="0.2" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
      <rect x="118" y="62" width="26" height="8" rx="4" fill="url(#flow-gradient)" opacity="0.4" />
      <rect x="118" y="76" width="18" height="6" rx="3" fill="url(#flow-gradient)" opacity="0.25" />

      <rect x="212" y="56" width="38" height="48" rx="12" fill="url(#flow-gradient)" opacity="0.2" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
      <rect x="218" y="62" width="26" height="8" rx="4" fill="url(#flow-gradient)" opacity="0.4" />
      <rect x="218" y="76" width="18" height="6" rx="3" fill="url(#flow-gradient)" opacity="0.25" />

      {/* Bottom result node */}
      <rect x="160" y="196" width="48" height="56" rx="16" fill="url(#flow-gradient)" opacity="0.25" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
      <rect x="170" y="206" width="28" height="8" rx="4" fill="url(#flow-gradient)" opacity="0.5" />
      <rect x="170" y="220" width="20" height="6" rx="3" fill="url(#flow-gradient)" opacity="0.3" />
      <rect x="170" y="232" width="24" height="6" rx="3" fill="url(#flow-gradient)" opacity="0.3" />

      {/* Labels */}
      <text x="31" y="48" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">360</text>
      <text x="131" y="48" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">IQ</text>
      <text x="231" y="48" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">EQ</text>
      <text x="184" y="190" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">Insights</text>

      <defs>
        <linearGradient id="flow-gradient" x1="0" y1="0" x2="400" y2="300">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
