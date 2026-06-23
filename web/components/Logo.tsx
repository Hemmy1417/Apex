export function ApexMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Apex"
    >
      {/* Peak shape */}
      <polygon points="50,8 92,88 78,88 50,38 22,88 8,88" fill="currentColor" />
      {/* Horizon cut */}
      <rect x="16" y="62" width="68" height="3" fill="var(--color-canvas, #000)" />
    </svg>
  );
}

export function ApexWordmark() {
  return (
    <span className="inline-flex items-center gap-2">
      <ApexMark size={28} />
      <span className="wordmark text-lg">APEX</span>
    </span>
  );
}
